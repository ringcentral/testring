import { join as pathJoin } from 'path';

// import { IWriteAcquireData, IWriteAcquireDataReq , IConfig } from '@testring/types';
import { generateUniqId }  from '@testring/utils';
import { transport } from '@testring/transport';
import { PluggableModule } from '@testring/pluggable-module';

import { FSQueue, hooks as queHooks } from './fs-queue';
// import { ensureDir } from './utils';


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

export class FSQueueServerOld extends PluggableModule  {

    private reqName: string;
    private resName: string;
    private releaseName: string;
    private cleanName: string;
    private unHookReqTransport: (() => void )| null = null;
    private unHookReleaseTransport: (() => void) | null = null;
    private unHookCleanWorkerTransport: (() => void) | null = null;
    private queue: FSQueue;
    private fNames = {};

    private initState: serverState = serverState.new;
    private initEnsured: Promise<any>;
    private initialize: (any) => void;
    
    constructor(msgNamePrefix: string = 'fs-queue') {
        super(Object.values(hooks));
        this.reqName = msgNamePrefix +'_request_write';
        this.resName = msgNamePrefix +'_allow_write';
        this.releaseName = msgNamePrefix +'_release_write';
        this.cleanName = msgNamePrefix +'_release_worker';
        
        this.initEnsured = new Promise(resolve=>{
            this.initialize = resolve;
        });
    }

    public getInitState(): number {
        return this.initState;
    }

    public async init(maxWriteThreadCount: number = 10): Promise<void> {
        // ensure init once
        if (this.initState !== serverState.new) {
            throw new Error('Cannot reinitialize component (queue server is singleton)');
        }
        this.initState = serverState.initStarted;

        this.queue = new FSQueue(maxWriteThreadCount);        

        const acqHook = this.queue.getHook(queHooks.ON_ACQUIRE);
        if (acqHook) {
            acqHook.readHook('queServer', async ({ workerId, requestId })=>{
                const fileName = await this.generateUniqFileName(workerId, requestId);
                transport.send<IWriteAcquireData>(workerId, this.resName, { requestId, fileName });
            });
        }

        this.unHookReqTransport = transport.on<IWriteAcquireDataReq>(this.reqName, async (msgData, workerId='*')=>{
            const { requestId } = msgData;
            await this.initEnsured;
            this.queue.acquire(workerId, requestId);
        });

        this.unHookReleaseTransport = transport.on<IWriteAcquireDataReq>(this.releaseName, (msgData, workerId='*')=>{
            const { requestId } = msgData;
            this.callHook(hooks.ON_RELEASE, { workerId, requestId });
            this.queue.release(workerId, requestId);
        });

        this.unHookCleanWorkerTransport = transport.on<{}>(this.cleanName, (msgData, workerId='*')=>{
            this.queue.clean(workerId);
        });

        this.initialize(true);
        this.initState = serverState.initialized;
    }

    public cleanUpTransport() {
        this.unHookReqTransport && this.unHookReqTransport();
        this.unHookReleaseTransport && this.unHookReleaseTransport();
        this.unHookCleanWorkerTransport && this.unHookCleanWorkerTransport();
    }

    public removeFileNames(workerId: string, requestId: string | undefined) {
        const delKeys = Object.keys(this.fNames).filter((fName)=>{
            const [wId, rId] = fName.split('-', 3);
            return workerId === wId && (!requestId || requestId === rId);
        });
        delKeys.forEach(fName=>{
            delete this.fNames[fName];
        });
    } 
    
    public removeFileName(fileName: string) {
        delete this.fNames[fileName];
    }

    public getNameList() {
        return Object.keys(this.fNames);
    }

    private async generateUniqFileName(workerId: string, requestId: string, ext='png') {
        const screenDate = new Date();
        const formattedDate = (`${screenDate.toLocaleTimeString()} ${screenDate.toDateString()}`)
                .replace(/\s+/g, '_');
        
        const fileNameBase = `${workerId.replace('/','.')}-${requestId}-${generateUniqId(5)}-${formattedDate}.${ext}`;

        const { fileName, path } = await this.callHook(hooks.ON_FILENAME,
             { workerId, requestId, fileName: fileNameBase, path:this.savePath },
             );  
             
        const resultFileName = pathJoin(path, fileName);

        if (this.fNames[resultFileName]) {
            // eslint-disable-next-line ringcentral/specified-comment-with-task-id
            // FIXME: possible loop hence plugins can return same file name during every request
            return this.generateUniqFileName(workerId, ext);
        }
        this.fNames[resultFileName] = workerId;
        return resultFileName; 
    }
    
}
