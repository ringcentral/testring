import { generateUniqId }  from '@testring/utils';
import { transport } from '@testring/transport';


import { IChgAcqResp } from '@testring/types';


export class FSQueueClient {

    private reqName: string;
    private resName: string;
    private releaseName: string;
    private cleanName: string;
    private reqHash: Record<string, Record<string, number|((string) => void)>> = {};

    constructor(msgNamePrefix: string = 'fs-queue') {
        this.reqName = msgNamePrefix +'_request_write';
        this.resName = msgNamePrefix +'_allow_write';
        this.releaseName = msgNamePrefix +'_release_write';
        this.cleanName = msgNamePrefix +'_release_worker';
        
        this.init();
    }

    private init() {        
        // hook on response - get request Object according to requestID & call CB 
        transport.on<IChgAcqResp>(this.resName, (msgData)=>{
            const { requestId, fileName } = msgData;
            const reqObj = this.reqHash[requestId];
            if (reqObj && reqObj.cb && typeof reqObj.cb === 'function') {                
                reqObj.cb(fileName);                
            }
            // FIX: if no reqObj found - possible race with release or miss on transport endpoint           
        });
    }

    /**
     * acquire/request permission to write file - give CB for call with valid fileName 
     * @param cb - CB to call with resulting file name from server & plugins
     * @param requestId - an ID for find cb with resulting file name
     * @returns
     */
    public getPermission( cb: (fName: string) => void, requestId: string = ''): string {

        if (requestId === '') {
            requestId = generateUniqId(10);
            while (this.reqHash[requestId]) {
                requestId = generateUniqId(10);
            }
        } else {
            if (this.reqHash[requestId]) {
                throw new Error('Not uniq requestId given!');
            }
        }
        this.reqHash[requestId] = { tries:0, cb };
        transport.broadcast(this.reqName, { requestId });
        return requestId;
    }

    public releasePermission(requestId: string) {
        delete this.reqHash[requestId];
        transport.broadcast(this.releaseName, { requestId });
    }   

    public releaseAllWorkerPermissions() {
        transport.broadcast(this.cleanName, {});
    }    
}
