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
import { generateUniqId }  from '@testring/utils';
import { transport } from '@testring/transport';
import { PluggableModule } from '@testring/pluggable-module';

// import { FSQueue, hooks as queHooks } from './fs-queue';
import { FSQueueServer } from './fs-queue-server';
import { FSActionQueue } from './fs-action-queue';
import { LocalTransport } from './server_utils/LocalTransport';


enum serverState  {
    'new'=0,
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

export class FSStoreServer extends PluggableModule  {

    private reqName: string;
    private resName: string;
    private releaseName: string;
    private cleanName: string;
    private unHookReqTransport: (() => void )| null = null;
    private unHookReleaseTransport: (() => void) | null = null;
    private unHookCleanWorkerTransport: (() => void) | null = null;
    private fqs: FSQueueServer;
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
    constructor( FQS: FSQueueServer|number = 10, msgNamePrefix: string = 'fs-store' ) {
        super(Object.values(hooks));
        
        if (typeof(FQS) === 'number') {
            this.fqsTransport = new LocalTransport();
            this.queServerPrefix = 'fs-que';
            this.fqs = new FSQueueServer(FQS, this.queServerPrefix, this.fqsTransport);
        } else {
            this.fqs = FQS;
            this.fqsTransport = this.fqs.getTransport();
            this.queServerPrefix = this.fqs.getMsgPrefix(); 
        }

        this.queReq = this.queServerPrefix +'_request_thread';
        this.queResp = this.queServerPrefix +'_allow_thread';
        this.queRelease = this.queServerPrefix +'_release_thread';
        
        this.reqName = msgNamePrefix + '_request_action';
        this.resName = msgNamePrefix +'_allow_action';
        this.releaseName = msgNamePrefix +'_release_action';
        this.cleanName = msgNamePrefix +'_release_worker';
        
        
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
            const [action, fileName] = this.workerRequests[wId][rId];

            transport.send<IFSStoreResp>(wId, this.resName, { requestId:rId, fileName, action, status:'OK' });
        });

        this.unHookReqTransport = transport.on<IFSStoreReq>(this.reqName, async (msgData, workerId = '*') => {
            const { requestId, action, meta } = msgData;
            let { fileName } = msgData;
            if (!fileName) { // no fileName giver - need to construct one
                if (action === fsReqType.unlink) { // if no fileName during unlink -> ERROR
                    transport.send<IFSStoreResp>(workerId,
                        this.resName,
                        {
                            requestId,
                            action,
                            fileName:'',
                            status: 'no fileName for action',
                        });
                
                    return; 
                }
                const { ext, path } = meta;
                fileName = await this.generateUniqFileName(workerId, requestId, ext, path );
            }
            
            this.RequestAction({ requestId, fileName, action, meta }, workerId);
        });

        this.unHookReleaseTransport = transport.on<IFSStoreReq>(this.releaseName, (msgData, workerId='*')=>{
            this.ReleaseAction(msgData, workerId);        
        });

        this.unHookCleanWorkerTransport = transport.on<IFSStoreReq>(this.cleanName, (msgData, workerId='*')=>{
            this.ClearAction(msgData, workerId);        
        });
    }

    public cleanUpTransport() {
        this.unHookReqTransport && this.unHookReqTransport();
        this.unHookReleaseTransport && this.unHookReleaseTransport();
        this.unHookCleanWorkerTransport && this.unHookCleanWorkerTransport();
    }

    private ensureActionQueue({ action, requestId, fileName, meta }: IFSStoreReqFixed, workerId: string) { 
        if (!this.files[fileName]) { 
            this.files[fileName] = [new FSActionQueue(fileName), {}];
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
                    transport.send<IFSStoreResp>(workerId, this.resName, { requestId, fileName, action, status:'OK' });
                });
                break;
            case fsReqType.access:
                FAQ.hookAccess(workerId, requestId, (dataObj, endCb) => { 
                    cbRec[workerId][requestId] = endCb;
                    this.fqsTransport
                        .broadcast<IQueAcqReq>(this.queReq, { requestId: constructWRID(workerId, requestId) });        
                });
                break;
            case fsReqType.unlink:
                FAQ.hookUnlink(workerId, requestId, (dataObj, endCb) => {
                    cbRec[workerId][requestId] = endCb;
                    transport.send<IFSStoreResp>(workerId, this.resName, { requestId, fileName, action, status:'OK' });
                });
        }
    }
    
    private async ReleaseAction(data: IFSStoreReq, workerId: string) {
        const { requestId, action, fileName } = data;
        if (!fileName) { 
            return false;
        }
        const cbRec = this.files[fileName][1];

        if (action === fsReqType.access) {
            this.fqsTransport
                .broadcast<IQueAcqReq>(this.queRelease, { requestId: constructWRID(workerId, requestId) });
        }

        this.callHook(hooks.ON_RELEASE, { workerId, requestId, fileName });

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

    private async generateUniqFileName(workerId: string, requestId: string, ext='tmp', savePath='/'): Promise<string> {
        const screenDate = new Date();
        const formattedDate = (`${screenDate.toLocaleTimeString()} ${screenDate.toDateString()}`)
                .replace(/\s+/g, '_');
        
        const fileNameBase = `${workerId.replace('/','.')}-${requestId}-${generateUniqId(5)}-${formattedDate}.${ext}`;

        const { fileName, path } = await this.callHook(hooks.ON_FILENAME,
             { workerId, requestId, fileName: fileNameBase, path:savePath },
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
