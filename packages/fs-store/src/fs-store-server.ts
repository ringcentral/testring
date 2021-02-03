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

export { hooks as fsQueueServerHooks }; 
    
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
    private savePath: string;
    private unHookReqTransport: (() => void )| null = null;
    private unHookReleaseTransport: (() => void) | null = null;
    private unHookCleanWorkerTransport: (() => void) | null = null;
    private fqs: FSQueueServer;
    private fqsTransport: ITransport;
    private queServerPrefix: string;
    // private testReq: string;
    // private testResp: string;
    private queReq: string;
    private queResp: string;
    private queRelease: string;

    private files: Record<string, [FSActionQueue, cbRecord]> = {}; 
    private workerRequests: Record<string, [fsReqType, string]> = {};
    private usedFiles: Record<string, boolean> = {};

    private state: serverState = serverState.new;
    // private initEnsured: Promise<any>;
    // private initialize: (any) => void;
    
    /**
     * 
     * @param msgNamePrefix 
     * @param queServerPrefix 
     * @param FQS 
     */
    constructor(msgNamePrefix: string = 'fs-store', FQS: FSQueueServer|number = 10) {
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

        // this.testReq = this.queServerPrefix +'_test';
        // this.testResp = this.queServerPrefix +'_test_resp';
        this.queReq = this.queServerPrefix +'_request_thread';
        this.queResp = this.queServerPrefix +'_allow_thread';
        this.queRelease = this.queServerPrefix +'_release_thread';
        
        this.reqName = msgNamePrefix + '_request_action';
        this.resName = msgNamePrefix +'_allow_action';
        this.releaseName = msgNamePrefix +'_release_action';
        this.cleanName = msgNamePrefix +'_release_worker';
        
        // this.initEnsured = new Promise(resolve=>{
        //     this.initialize = resolve;
        // });
        this.init();
    }
    
    public getInitState(): number {
        return this.state;
    }

    public init() {
        // ensure init once
        if (this.state !== serverState.new) {
            return false; // no need to reinit server
        }
        this.state = serverState.initStarted;

        // const acqHook = this.queue.getHook(queHooks.ON_ACQUIRE);
        // if (acqHook) {
        //     acqHook.readHook('queServer', async ({ workerId, requestId })=>{
        //         const fileName = await this.generateUniqFileName(workerId, requestId);
        //         transport.send<IWriteAcquireData>(workerId, this.resName, { requestId, fileName });
        //     });
        // }

        this.fqsTransport.on<IQueAcqResp>(this.queResp, ({ requestId }) => { 
            const [wId, rId] = destructWRID(requestId);
            const [action, fileName] = this.workerRequests[requestId];

            transport.send<IFSStoreResp>(wId, this.resName, { requestId:rId, fileName, action });
        });

        this.unHookReqTransport = transport.on<IFSStoreReq>(this.reqName, async (msgData, workerId='*')=>{
            // const { requestId, fileName, action} = msgData;
            this.RequestAction(msgData, workerId);
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

    private async ensureActionQueue({ action, requestId, fileName, meta }: IFSStoreReq, workerId: string) { 
        if (!fileName) { 
            fileName = await this.generateUniqFileName(workerId, requestId, meta && meta.ext);
        }
        if (!this.files[fileName]) { 
            this.files[fileName] = [new FSActionQueue(fileName), {}];
            this.workerRequests[constructWRID(workerId, requestId)] = [action, fileName];
            delete this.usedFiles[fileName];
        }
        return fileName;
    }

    private ensureCbRecord(cbRecord: cbRecord, workerId: string) { 
        if (!cbRecord[workerId]) { 
            cbRecord[workerId] = {};
        }
    }

    private async RequestAction(data: IFSStoreReq, workerId: string) { 
        const fName = await this.ensureActionQueue(data, workerId);
        const { action, requestId } = data;

        const cbRec = this.files[fName][1];

        this.ensureCbRecord(cbRec, workerId);

        switch (action) { 
            case fsReqType.read:
                this.files[fName][0].acquireRead(workerId, requestId, (dataId, endCb) => {
                    cbRec[workerId][requestId] = endCb;
                    transport.send<IFSStoreResp>(workerId, this.resName, { requestId, fileName:fName, action });
                });
                break;
            case fsReqType.write:
                this.files[fName][0].hookWrite(workerId, requestId, (dataId, endCb) => { 
                    cbRec[workerId][requestId] = endCb;
                    this.fqsTransport
                        .broadcast<IQueAcqReq>(this.queReq, { requestId: constructWRID(workerId, requestId) });        
            
                });
                break;
            case fsReqType.unlink:
                this.files[fName][0].hookUnlink(workerId, requestId, (dataId, endCb) => { 
                    cbRec[workerId][requestId] = endCb;
                    transport.send<IFSStoreResp>(workerId, this.resName, { requestId, fileName:fName, action });
                
                    // this.fqsTransport
                    //     .broadcast<IQueAcqReq>(
                    //          this.queReq, 
                    //          { requestId: constructWRID(workerId, requestId) });        
                    
                });
        }
    }
    
    private async ReleaseAction(data: IFSStoreReq, workerId: string) { 
        const fName = await this.ensureActionQueue(data, workerId);
        const { requestId, action } = data;
        const cbRec = this.files[fName][1];

        if (action === fsReqType.write) { 
            this.fqsTransport
                .broadcast<IQueAcqReq>(this.queRelease, { requestId: constructWRID(workerId, requestId) });        
        }

        const cb = cbRec[workerId] && cbRec[workerId][requestId];

        cb && cb();        
    }
    
    private async ClearAction(data: IFSStoreReq, workerId: string) { 
        const fName = await this.ensureActionQueue(data, workerId);
        const { action } = data;
        const cbRec = this.files[fName][1];

        this.ensureCbRecord(cbRec, workerId);

        switch (action) { 
            case fsReqType.read:
                this.files[fName][0].cleanRead(workerId);
                break;
            case fsReqType.write:
                this.files[fName][0].cleanWrite(workerId);
                break;
            case fsReqType.unlink:
                this.files[fName][0].cleanUnlink(workerId);
        }
    }    

    public getNameList() {
        return Object.keys(this.files);
    }

    private async generateUniqFileName(workerId: string, requestId: string, ext='tmp'): Promise<string> {
        const screenDate = new Date();
        const formattedDate = (`${screenDate.toLocaleTimeString()} ${screenDate.toDateString()}`)
                .replace(/\s+/g, '_');
        
        const fileNameBase = `${workerId.replace('/','.')}-${requestId}-${generateUniqId(5)}-${formattedDate}.${ext}`;

        const { fileName, path } = await this.callHook(hooks.ON_FILENAME,
             { workerId, requestId, fileName: fileNameBase, path:this.savePath },
             );  
             
        const resultFileName = pathJoin(path, fileName);

        if (this.files[resultFileName] !== undefined || this.usedFiles[resultFileName]) {
            // eslint-disable-next-line ringcentral/specified-comment-with-task-id
            // FIXME: possible loop hence plugins can return same file name during every request
            return this.generateUniqFileName(workerId, ext);
        }
        this.usedFiles[resultFileName] = true;
        return resultFileName; 
    }
    
}
