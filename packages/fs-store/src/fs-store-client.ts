/**
 * An abstraction class to hide transport implementation 
 */

import { generateUniqId } from '@testring/utils';
import { transport } from '@testring/transport';


import {
    fsReqType,    
    IFSStoreReq,
    IFSStoreResp,
} from '@testring/types';

export type requestMeta = {
    fileName?: string;
    ext?: string;
    path?: string;
    requestId?: string;
}

type requestsTable = Record<string, Record<string,  fsReqType | number | null | ((string) => void)>>

export class FSStoreClient {

    private reqName: string;
    private resName: string;
    private releaseName: string;
    private cleanName: string;
    private reqHash: requestsTable  = {};

    constructor(msgNamePrefix: string = 'fs-store') {
        this.reqName = msgNamePrefix + '_request_write';
        this.resName = msgNamePrefix + '_allow_write';
        this.releaseName = msgNamePrefix + '_release_write';
        this.cleanName = msgNamePrefix + '_release_worker';
        
        this.init();
    }

    private init() {

        // hook on response - get request Object according to requestID & call CB 
        transport.on<IFSStoreResp>(this.resName, (msgData) => {
            const { requestId, fileName, status } = msgData;
            if (status !== 'OK') { 
                // eslint-disable-next-line no-console
                console.error(msgData);
            }
            const reqObj = this.reqHash[requestId];
            if (reqObj) {
                if (reqObj.action && reqObj.action === fsReqType.release) { 
                    delete this.reqHash[requestId];        
                }
                if (reqObj.cb && typeof reqObj.cb === 'function') {
                    reqObj.cb(fileName);
                }
            }
            // FIX: if no reqObj found - possible race with release or miss on transport endpoint           
        });
    }

    private ensureRequestId(requestId: string | undefined) { 
        if (!requestId || requestId === '') {
            requestId = generateUniqId(10);
            while (this.reqHash[requestId]) {
                requestId = generateUniqId(10);
            }
        } else {
            if (this.reqHash[requestId]) {
                throw new Error('Not uniq requestId given!');
            }
        }
        return requestId;
    } 
        

    /**
     * acquire/request permission to write file - give CB for call with valid fileName 
     * @param cb - CB to call with resulting file name from server & plugins
     * @param options - an ID for find cb with resulting file name
     * @returns
     */
    public getLockPermission(cb: (fName: string) => void, opts: requestMeta): string {
        let { requestId, fileName, ext, path } = opts;
        requestId = this.ensureRequestId(requestId);
        const action =  fsReqType.lock;
        this.reqHash[requestId] = { tries:0, cb , action };
        transport.broadcast<IFSStoreReq>(this.reqName, { requestId, action, fileName, meta: { ext , path } });
        return requestId;
    }

    /**
     * acquire/request permission to write file - give CB for call with valid fileName 
     * @param cb - CB to call with resulting file name from server & plugins
     * @param options - an ID for find cb with resulting file name
     * @returns
     */
    public getAccessPermission( cb: (fName: string) => void, opts: requestMeta): string {

        let { requestId, fileName, ext, path } = opts;
        requestId = this.ensureRequestId(requestId);
        const action =  fsReqType.access;        
        this.reqHash[requestId] = { tries:0, cb , action };
        transport.broadcast<IFSStoreReq>(this.reqName, { requestId, action, fileName, meta: { ext, path } });
        return requestId;
    }

    /**
     * acquire/request permission to write file - give CB for call with valid fileName 
     * @param cb - CB to call with resulting file name from server & plugins
     * @param options - an ID for find cb with resulting file name
     * @returns
     */
    public getUnlinkPermission( cb: (fName: string) => void, opts: requestMeta): string {

        let { requestId, fileName, ext, path } = opts;
        if (!fileName) { 
            throw new Error('NO FileName giver for unlink permission request task');
        }
        requestId = this.ensureRequestId(requestId);
        const action = fsReqType.unlink;
        this.reqHash[requestId] = { tries:0, cb, action };
        transport
            .broadcast<IFSStoreReq>(this.reqName, { requestId, action, fileName, meta: { ext, path } });
        return requestId;
    }

    public releasePermission(requestId: string, cb?: () => void) {
        const { action } = this.reqHash[requestId];
        const reqData: Record<string, any> = { tries: 0, action: fsReqType.release };   
        if (cb) { 
            reqData.cb = cb;
        }
        this.reqHash[requestId] = reqData;
        transport.broadcast<IFSStoreReq>(this.releaseName, { requestId, action: action as fsReqType, meta: {} });
    }   

    public releaseAllWorkerPermissions() {
        transport.broadcast(this.cleanName, {});
    }    
}
