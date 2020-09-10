import { resolve as pathResolve, join as pathJoin } from 'path';
import { IWriteAcquireData, IWriteAcquireDataReq } from '@testring/types';
import { generateUniqId }  from '@testring/utils';
import { transport } from '@testring/transport';

import { FSQueue, hooks as queHooks } from './fs-queue';
import { FSFile } from './fs-file';


export class FSQueueServer {

    private reqName: string;
    private resName: string;
    private releaseName: string;
    private cleanName: string;
    private savePath: string;
    private unHookReqTransport: (() => void )| null = null;
    private unHookReleaseTransport: (() => void) | null = null;
    private unHookCleanWorkerTransport: (() => void) | null = null;
    private queue: FSQueue;
    private fNames = {};

    
    constructor(writeQueLength: number = 10, globalSavePath: string = './', msgNamePrefix: string = 'fs-store') {
        this.queue = new FSQueue(writeQueLength);
        this.reqName = msgNamePrefix +'_request_write';
        this.resName = msgNamePrefix +'_allow_write';
        this.releaseName = msgNamePrefix +'_release_write';
        this.cleanName = msgNamePrefix +'_release_worker';
        this.savePath = pathResolve(globalSavePath);        
    }

    public async init() {
        const file = new FSFile(pathJoin(this.savePath, 'tmp.txt'));
        await file.ensureDir();

        const acqHook = this.queue.getHook(queHooks.ON_ACQUIRE);
        if (acqHook) {
            acqHook.readHook('queServer', ({ workerId, requestId })=>{
                const fileName = pathJoin(this.savePath, this.generateUniqFileName(workerId, requestId));
                transport.send<IWriteAcquireData>(workerId, this.resName, { requestId, fileName });
            });
        }
        
        this.unHookReqTransport = transport.on<IWriteAcquireDataReq>(this.reqName, (msgData, workerId='*')=>{
            const { requestId } = msgData;
            this.queue.acquire(workerId, requestId);
        });

        this.unHookReleaseTransport = transport.on<IWriteAcquireDataReq>(this.releaseName, (msgData, workerId='*')=>{
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

    private generateUniqFileName(workerId: string, requestId: string, ext='png') {
        const screenDate = new Date();
        const formattedDate = (`${screenDate.toLocaleTimeString()} ${screenDate.toDateString()}`)
                .replace(/\s+/g, '_');
        
        const fName = `${workerId.replace('/','.')}-${requestId}-${generateUniqId(5)}-${formattedDate}.${ext}`;

        if (this.fNames[fName]) {
            return this.generateUniqFileName(workerId, ext);
        }
        this.fNames[fName] = workerId;
        return fName; 
    }
    
}
