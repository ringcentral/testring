import { join as pathJoin } from 'path';

import {
    IQueAcqReq,
    IQueAcqResp,
    // IQueTestReq,
    // IQueTestResp,
    // IChgAcqReq,
    // IChgAcqResp,
    // IDelAcqReq,
    // IDelAcqResp,
    IFSStoreReq,
    IFSStoreReqFixed,
    IFSStoreResp,
    fsReqType,
    ITransport,
} from '@testring/types';
import { generateUniqId } from '@testring/utils';
import { transport } from '@testring/transport';
import { PluggableModule } from '@testring/pluggable-module';

// import { FSQueue, hooks as queHooks } from './fs-queue';
import { FSActionServer } from './fs-action-server';
import { FSActionQueue } from './fs-action-queue';
import { LocalTransport } from './server_utils/LocalTransport';


import { FS_CONSTANTS, getNewLog } from './utils';

const logger = getNewLog({ m: 'fss' });
const DW_ID = FS_CONSTANTS.DW_ID as string;

export enum serverState {
    'new' = 0,
    'initStarted',
    'initialized',
}

const hooks = {
    ON_FILENAME: 'onFileName',
    ON_RELEASE: 'onRelease',
};

export { hooks as fsStoreServerHooks };

type cbRecord = Record<string, Record<string, (() => void) | undefined>>


function constructWRID(wId: string, rId: string) {
    return `${wId}___${rId}`;
}
function destructWRID(id: string) {
    return id.split('___');
}

export class FSStoreServer extends PluggableModule {

    private reqName: string;
    private resName: string;
    private releaseReqName: string;
    private cleanReqName: string;
    private unHookReqTransport: (() => void) | null = null;
    private unHookReleaseTransport: (() => void) | null = null;
    private unHookCleanWorkerTransport: (() => void) | null = null;
    private fqs: FSActionServer;
    private fqsTransport: ITransport;
    private queServerPrefix: string;
    private queReq: string;
    private queResp: string;
    private queRelease: string;

    private files: Record<string, [FSActionQueue, cbRecord]> = {};
    private workerRequests: Record<string, Record<string, [fsReqType, string]>> = {};
    private usedFiles: Record<string, boolean> = {};

    private state: serverState = serverState.new;

    /**
     * 
     * @param msgNamePrefix 
     * @param queServerPrefix 
     * @param FQS 
     */
    constructor(FQS: FSActionServer | number = 10, msgNamePrefix: string = 'fs-store') {
        super(Object.values(hooks));

        if (typeof (FQS) === 'number') {
            this.fqsTransport = new LocalTransport();
            this.queServerPrefix = 'fs-que';
            this.fqs = new FSActionServer(FQS, this.queServerPrefix, this.fqsTransport);
        } else {
            this.fqs = FQS;
            this.fqsTransport = this.fqs.getTransport();
            this.queServerPrefix = this.fqs.getMsgPrefix();
        }

        this.queReq = this.queServerPrefix + FS_CONSTANTS.FAS_REQ_POSTFIX;
        this.queResp = this.queServerPrefix + FS_CONSTANTS.FAS_RESP_POSTFIX;
        this.queRelease = this.queServerPrefix + FS_CONSTANTS.FAS_RELEASE_POSTFIX;


        this.reqName = msgNamePrefix + FS_CONSTANTS.FS_REQ_NAME_POSTFIX;
        this.resName = msgNamePrefix + FS_CONSTANTS.FS_RESP_NAME_POSTFIX;
        this.releaseReqName = msgNamePrefix + FS_CONSTANTS.FS_RELEASE_NAME_POSTFIX;
        this.cleanReqName = msgNamePrefix + FS_CONSTANTS.FS_CLEAN_REQ_NAME_POSTFIX;


        this.init();
    }

    public getState(): number {
        return this.state;
    }

    public init() {
        // ensure init once
        if (this.state !== serverState.new) {
            return false; // no need to reinit server
        }
        this.state = serverState.initStarted;

        this.fqsTransport.on<IQueAcqResp>(this.queResp, ({ requestId }) => {
            const [wId, rId] = destructWRID(requestId);
            logger.debug({ wReq: this.workerRequests, requestId, wId, rId }, 'on RESP');
            if (!this.workerRequests[wId][rId]) {
                logger.error({ wReq: this.workerRequests, requestId, wId, rId }, 'NO WORKER REQUEST');
                return;
            }
            const [action, fileName] = this.workerRequests[wId][rId];

            delete this.workerRequests[wId][rId];

            this.send<IFSStoreResp>(wId, this.resName, { requestId: rId, fileName, action, status: 'OK' });
        });

        this.unHookReqTransport = transport
            .on<IFSStoreReq>(this.reqName, async (msgData, workerId = DW_ID) => {
                logger.debug({ msgData, workerId, files: this.files }, 'GOT REQ...');
                const { requestId, action, meta } = msgData;
                let { fileName } = msgData;
                if (!fileName) { // no fileName giver - need to construct one
                    if (action === fsReqType.unlink) { // if no fileName during unlink -> ERROR
                        this.send<IFSStoreResp>(workerId,
                            this.resName,
                            {
                                requestId,
                                action,
                                fileName: '',
                                status: 'no fileName for action',
                            });

                        return;
                    }
                    const { ext, path } = meta;
                    fileName = await this.generateUniqFileName(workerId, requestId, ext, path);
                }

                this.RequestAction({ requestId, fileName, action, meta }, workerId);
            });

        this.unHookReleaseTransport = transport
            .on<IFSStoreReq>(this.releaseReqName, (msgData, workerId = DW_ID) => {
                this.ReleaseAction(msgData, workerId);
            });

        this.unHookCleanWorkerTransport = transport
            .on<IFSStoreReq>(this.cleanReqName, (msgData, workerId = DW_ID) => {
                this.ClearAction(msgData, workerId);
            });

        this.state = serverState.initialized;
    }

    private send<T>(workerId: string | undefined, msgId: string, data: T) {
        logger.trace({ workerId, msgId, data }, 'fs send');
        if (!workerId || workerId === DW_ID) {
            transport.broadcastUniversally<T>(
                msgId,
                data);
        } else {
            transport.send<T>(
                workerId,
                msgId,
                data);
        }
    }

    public cleanUpTransport() {
        this.unHookReqTransport && this.unHookReqTransport();
        this.unHookReleaseTransport && this.unHookReleaseTransport();
        this.unHookCleanWorkerTransport && this.unHookCleanWorkerTransport();
    }

    private ensureActionQueue({ action, requestId, fileName, meta }: IFSStoreReqFixed, workerId: string) {
        if (!this.files[fileName]) {
            this.files[fileName] = [new FSActionQueue(fileName), {}];
            if (!this.workerRequests[workerId]) {
                this.workerRequests[workerId] = {};
            }
            this.workerRequests[workerId][requestId] = [action, fileName];
            delete this.usedFiles[fileName];
        }
    }

    private ensureCbRecord(cbRecord: cbRecord, workerId: string) {
        if (!cbRecord[workerId]) {
            cbRecord[workerId] = {};
        }
    }

    private async RequestAction(data: IFSStoreReqFixed, workerId: string) {
        this.ensureActionQueue(data, workerId);
        const { action, requestId, fileName } = data;

        const [FAQ, cbRec] = this.files[fileName];

        this.ensureCbRecord(cbRec, workerId);

        switch (action) {
            case fsReqType.lock:
                FAQ.lock(workerId, requestId, (dataObj, endCb) => {
                    cbRec[workerId][requestId] = endCb;
                    this.send<IFSStoreResp>(workerId, this.resName, { requestId, fileName, action, status: 'OK' });
                });
                break;
            case fsReqType.access:
                FAQ.hookAccess(workerId, requestId, (dataObj, endCb) => {
                    cbRec[workerId][requestId] = endCb;
                    this.workerRequests[workerId][requestId] = [action, fileName];

                    this.fqsTransport
                        .broadcastUniversally<IQueAcqReq>(
                            this.queReq,
                            {
                                requestId: constructWRID(workerId, requestId),
                            });
                });
                break;
            case fsReqType.unlink:
                FAQ.hookUnlink(workerId, requestId, (dataObj, endCb) => {
                    cbRec[workerId][requestId] = endCb;
                    logger.debug({ cbRec, action, requestId }, 'on unlink req');
                    this.send<IFSStoreResp>(workerId, this.resName, { requestId, fileName, action, status: 'OK' });
                });
        }
        logger.debug({ cbRec, action, requestId }, 'request action done');

    }

    private async ReleaseAction(data: IFSStoreReq, workerId: string) {
        logger.debug({ data, workerId }, 'FSS on release');
        const { requestId, action, fileName } = data;
        if (!fileName) {
            logger.warn({ workerId, requestId }, 'no fileName to release');
            return false;
        }
        const cbRec = this.files[fileName][1];

        if (action === fsReqType.access) {
            this.workerRequests[workerId][requestId] = [action, fileName];
            this.fqsTransport
                .broadcastUniversally<IQueAcqReq>(this.queRelease, { requestId: constructWRID(workerId, requestId) });
        }

        this.callHook(hooks.ON_RELEASE, { workerId, requestId, fileName, action });

        const cb = cbRec[workerId] && cbRec[workerId][requestId];

        cb && cb();
        return true;
    }

    private async ClearAction(data: IFSStoreReq, workerId: string) {
        const { action } = data;

        if (!action) {

            Object.keys(this.files).forEach(fName => {
                this.files[fName][0].cleanAccess(workerId);
                this.files[fName][0].cleanLock(workerId);
                this.files[fName][0].cleanUnlink(workerId);
            });
            return;
        }
        switch (action) {
            case fsReqType.access:
                Object.keys(this.files).forEach(fName => {
                    this.files[fName][0].cleanAccess(workerId);
                });
                break;
            case fsReqType.lock:
                Object.keys(this.files).forEach(fName => {
                    this.files[fName][0].cleanLock(workerId);
                });
                break;
            case fsReqType.unlink:
                Object.keys(this.files).forEach(fName => {
                    this.files[fName][0].cleanUnlink(workerId);
                });
        }
    }

    public getNameList() {
        return Object.keys(this.files);
    }

    private async generateUniqFileName(
        workerId: string,
        requestId: string,
        ext = 'tmp',
        savePath = '/',
    ): Promise<string> {

        const screenDate = new Date();
        const formattedDate = (`${screenDate.toLocaleTimeString()} ${screenDate.toDateString()}`)
            .replace(/\s+/g, '_');

        const fileNameBase = `${workerId.replace('/', '.')}-${requestId}-${generateUniqId(5)}-${formattedDate}.${ext}`;

        const { fileName, path } = await this.callHook(hooks.ON_FILENAME,
            { workerId, requestId, fileName: fileNameBase, path: savePath },
        );

        const resultFileName = pathJoin(path, fileName);

        if (this.files[resultFileName] !== undefined || this.usedFiles[resultFileName]) {
            // eslint-disable-next-line ringcentral/specified-comment-with-task-id
            // FIXME: possible loop hence plugins can return same file name during every request
            return this.generateUniqFileName(workerId, requestId, ext, savePath);
        }
        this.usedFiles[resultFileName] = true;
        return resultFileName;
    }

}
