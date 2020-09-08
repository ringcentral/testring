import { IWriteAcquireData } from '@testring/types';
import { transport } from '@testring/transport';

import { FSQueue, hooks as queHooks } from './fs-queue';


export class FSQueueServer {

    private reqName: string;
    private resName: string;
    private releaseName: string;
    private cleanName: string;
    private unHookReqTransport: (() => void )| null = null;
    private unHookReleaseTransport: (() => void) | null = null;
    private unHookCleanWorkerTransport: (() => void) | null = null;
    private queue: FSQueue
    
    constructor(writeQueLength: number = 10, msgNamePrefix: string = 'fs-store') {
        this.queue = new FSQueue(writeQueLength);
        this.reqName = msgNamePrefix +'_request_write';
        this.resName = msgNamePrefix +'_allow_write';
        this.releaseName = msgNamePrefix +'_release_write';
        this.cleanName = msgNamePrefix +'_release_worker';
        
        this.init();
    }

    private init() {
        const acqHook = this.queue.getHook(queHooks.ON_ACQUIRE);
        if (acqHook) {
            acqHook.readHook('queServer', ({ workerId, requestId })=>{
                transport.send<IWriteAcquireData>(workerId, this.resName, { requestId });
            });
        }
        
        this.unHookReqTransport = transport.on<IWriteAcquireData>(this.reqName, (msgData, workerId='*')=>{
            const { requestId } = msgData;
            this.queue.acquire(workerId, requestId);
        });

        this.unHookReleaseTransport = transport.on<IWriteAcquireData>(this.releaseName, (msgData, workerId='*')=>{
            const { requestId } = msgData;
            this.queue.release(workerId, requestId);
        });
        
        this.unHookCleanWorkerTransport = transport.on<{}>(this.cleanName, (msgData, workerId='*')=>{
            this.queue.clean(workerId);
        });
    }

    public cleanUpTransport() {
        this.unHookReqTransport && this.unHookReqTransport();
        this.unHookReleaseTransport && this.unHookReleaseTransport();
        this.unHookCleanWorkerTransport && this.unHookCleanWorkerTransport();
    }
    
}
