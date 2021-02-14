import { join as pathJoin } from 'path';

import {
    // IQueAcqReq,
    // IQueAcqResp,
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
import { FSActionClient } from './fs-action-client';

import { FileActionHookService } from './server_utils/FileActionHookService';
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

type cleanCBRecord = Record<string, Record<string, (() => void) | undefined>>


// function constructWRID(wId: string, rId: string) {
//     return `${wId}___${rId}`;
// }
// function destructWRID(id: string) {
//     return id.split('___');
// }

const asyncActions = new Set([fsReqType.access, fsReqType.unlink]);

export class FSStoreServer extends PluggableModule {

    private reqName: string;
    private resName: string;
    private releaseReqName: string;
    private cleanReqName: string;
    private unHookReqTransport: (() => void) | null = null;
    private unHookReleaseTransport: (() => void) | null = null;
    private unHookCleanWorkerTransport: (() => void) | null = null;
    private fas: FSActionServer;
    private fac: FSActionClient;
    private fasTransport: ITransport;
    private queServerPrefix: string;
    // private queReq: string;
    // private queResp: string;
    // private queRelease: string;

    private files: Record<string, [FileActionHookService, cleanCBRecord]> = {};
    private inWorkRequests: Record<string, Record<string, [fsReqType, string, string?]>> = {};
    private usedFiles: Record<string, boolean> = {};

    private state: serverState = serverState.new;

    /**
     * 
     * @param msgNamePrefix 
     * @param queServerPrefix 
     * @param FQS 
     */
    constructor(FQS: FSActionServer | number = 10, msgNamePrefix: string = 'fs-store', queServerPrefix = 'fs-que') {
        super(Object.values(hooks));

        if (typeof (FQS) === 'number') {
            this.fasTransport = new LocalTransport();
            this.queServerPrefix = queServerPrefix;
            this.fas = new FSActionServer(FQS, this.queServerPrefix, this.fasTransport);
        } else {
            this.fas = FQS;
            this.fasTransport = this.fas.getTransport();
            this.queServerPrefix = this.fas.getMsgPrefix();
        }

        this.fac = new FSActionClient(this.queServerPrefix, this.fasTransport);


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

        // this.fasTransport.on<IQueAcqResp>(this.queResp, ({ requestId }) => {
        //     const [wId, rId] = destructWRID(requestId);
        //     logger.debug({ wReq: this.inWorkRequests, requestId, wId, rId }, 'on FAS RESP');
        //     if (!this.inWorkRequests[wId][rId]) {
        //         logger.error({ wReq: this.inWorkRequests, requestId, wId, rId }, 'NO WORKER REQUEST');
        //         return;
        //     }
        //     const [action, fileName] = this.inWorkRequests[wId][rId];

        //     delete this.inWorkRequests[wId][rId];

        //     this.send<IFSStoreResp>(wId, this.resName, { requestId: rId, fileName, action, status: 'OK' });
        //     // this.send<IFSStoreResp>(workerId, this.resName, { requestId, fileName, action, status: 'OK' });

        // });


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
            this.files[fileName] = [new FileActionHookService(fileName), {}];
            if (!this.inWorkRequests[workerId]) {
                this.inWorkRequests[workerId] = {};
            }
            this.inWorkRequests[workerId][requestId] = [action, fileName];
            delete this.usedFiles[fileName];
        }
    }

    private ensureCleanCBRecord(cleanCBRecord: cleanCBRecord, workerId: string) {
        if (!cleanCBRecord[workerId]) {
            cleanCBRecord[workerId] = {};
        }
    }

    private async RequestAction(data: IFSStoreReqFixed, workerId: string) {
        this.ensureActionQueue(data, workerId);
        const { action, requestId, fileName } = data;

        const [FAQ, cleanCBRec] = this.files[fileName];

        this.ensureCleanCBRecord(cleanCBRec, workerId);

        switch (action) {
            case fsReqType.lock:
                FAQ.lock(workerId, requestId, (dataObj, cleanCb) => {
                    cleanCBRec[workerId][requestId] = cleanCb;
                    this.send<IFSStoreResp>(workerId, this.resName, { requestId, fileName, action, status: 'OK' });
                });
                break;
            case fsReqType.access:
                FAQ.hookAccess(workerId, requestId, async (dataObj, cleanCb) => {
                    cleanCBRec[workerId][requestId] = cleanCb;

                    const threadRId = await this.fac.promisedThread();
                    this.inWorkRequests[workerId][requestId] = [action, fileName, threadRId];
                    this.send<IFSStoreResp>(workerId, this.resName, { requestId, fileName, action, status: 'OK' });

                    // this.fasTransport
                    //     .broadcastUniversally<IQueAcqReq>(
                    //         this.queReq,
                    //         {
                    //             requestId: constructWRID(workerId, requestId),
                    //         });
                });
                break;
            case fsReqType.unlink:
                FAQ.hookUnlink(workerId, requestId, async (dataObj, cleanCb) => {
                    cleanCBRec[workerId][requestId] = cleanCb;
                    logger.debug({ cleanCBRec, action, requestId }, 'on unlink req');

                    const threadRId = await this.fac.promisedThread();
                    this.inWorkRequests[workerId][requestId] = [action, fileName, threadRId];
                    this.send<IFSStoreResp>(workerId, this.resName, { requestId, fileName, action, status: 'OK' });


                    // this.fasTransport
                    //     .broadcastUniversally<IQueAcqReq>(
                    //         this.queReq,
                    //         {
                    //             requestId: constructWRID(workerId, requestId),
                    //         });
                });
        }
        logger.debug({ cleanCBRec, action, requestId }, 'request action done');

    }

    private async ReleaseAction(data: IFSStoreReq, workerId: string) {
        logger.debug({ data, workerId }, 'FSS on release');
        const { requestId, action, fileName } = data;
        if (!fileName) {
            logger.warn({ workerId, requestId }, 'no fileName to release');
            return false;
        }
        const [FAQ, cleanCBRec] = this.files[fileName];

        if (asyncActions.has(action)) {
            const inProgress = this.inWorkRequests[workerId][requestId];
            this.inWorkRequests[workerId][requestId] = [action, fileName];


            if (inProgress) {
                const [, , threadRId] = inProgress;
                if (threadRId) {
                    await this.fac.releasePromisedThread(threadRId);
                }
            }
            // this.send<IFSStoreResp>(workerId, this.resName, { requestId, fileName, action, status: 'OK' });
            this.send<IFSStoreResp>(workerId, this.resName, { requestId, fileName, action: fsReqType.release, status: 'OK' });

            // this.fasTransport
            //     .broadcastUniversally<IQueAcqReq>(this.queRelease, { requestId: constructWRID(workerId, requestId) });

            const cleanUpCB = cleanCBRec[workerId] && cleanCBRec[workerId][requestId];

            logger.debug({ fileName, action, cleanUpCB }, 'before next file async action step');
            cleanUpCB && cleanUpCB();
        } else {
            switch (action) {
                case fsReqType.lock:

                    const cleanUpCB = cleanCBRec && cleanCBRec[workerId] && cleanCBRec[workerId][requestId];
                    logger.debug({ fileName, action, cleanUpCB }, 'before next file action step');
                    if (cleanUpCB) {
                        cleanUpCB();
                    } else {
                        FAQ.unlock(workerId, requestId);
                    }
                    // this.send<IFSStoreResp>(workerId, this.resName, { requestId, fileName, action, status: 'OK' });
                    this.send<IFSStoreResp>(workerId, this.resName, { requestId, fileName, action: fsReqType.release, status: 'OK' });

            }
        }

        this.callHook(hooks.ON_RELEASE, { workerId, requestId, fileName, action });

        const faqState = {
            access: FAQ.getAccessQueueLength(),
            lock: FAQ.getLockPoolSize(),
            unlink: FAQ.getUnlinkQueueLength(),
        };

        logger.debug({ fileName, faqState }, 'on release done');

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
