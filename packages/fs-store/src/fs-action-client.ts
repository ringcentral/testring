/**
 * An abstraction class to hide transport implementation 
 */

import { generateUniqId } from '@testring/utils';
import { transport } from '@testring/transport';

import { IQueAcqReq, IQueAcqResp, IQueStateReq, IQueStateResp, ITransport } from '@testring/types';


import { FS_CONSTANTS, getNewLog } from './utils';

const logger = getNewLog({ m: 'fac' });

export type requestMeta = {
    fileName: string; // fullFileName
    ext?: string;
    path?: string;
    requestId?: string;
} | {
    fileName?: string;
    ext?: string; // by default 'tmp'
    path: string;
    requestId?: string;
}

// type requestsTable = Record<string, Record<string, fsReqType | string | number | null | ((string) => void)>>
type requestsTableItem = {
    cb?: ((rId: string, state: Record<string, any>) => void);
    dataId: string;
}
type requestsTable = Record<string, requestsTableItem>;

export class FSActionClient {

    private reqName: string;
    private resName: string;
    private releaseName: string;
    private cleanName: string;

    private stateReq: string;
    private stateResp: string;

    private reqHash: requestsTable = {};

    constructor(private msgNamePrefix: string = 'fs-store', tr: ITransport = transport) {

        this.stateReq = msgNamePrefix + FS_CONSTANTS.FAS_REQ_ST_POSTFIX;
        this.stateResp = msgNamePrefix + FS_CONSTANTS.FAS_RESP_ST_POSTFIX;

        this.reqName = msgNamePrefix + FS_CONSTANTS.FAS_REQ_POSTFIX;
        this.resName = msgNamePrefix + FS_CONSTANTS.FAS_RESP_POSTFIX;
        this.releaseName = msgNamePrefix + FS_CONSTANTS.FAS_RELEASE_POSTFIX;
        this.cleanName = msgNamePrefix + FS_CONSTANTS.FAS_CLEAN_POSTFIX;

        this.init();
    }

    getPrefix = () => this.msgNamePrefix;

    private init() {

        // hook on response - get request Object according to requestID & call CB 
        transport.on<IQueStateResp>(this.resName, (msgData) => {
            const { requestId, state } = msgData;
            const reqData = this.reqHash[requestId];
            if (reqData) {
                reqData.cb && reqData.cb(requestId, state);
            }
        });

        transport.on<IQueAcqResp>(this.resName, (msgData) => {
            const { requestId, fileName, status, action } = msgData;
            if (status !== 'OK') {
                logger.error({ requestId, fileName, status, action, reqHash: this.reqHash }, 'status not OK');
            }
            logger.debug({ requestId, fileName, status, action }, 'on fss resp');
            const reqObj = this.reqHash[requestId];
            if (reqObj) {
                if (reqObj.action && reqObj.action === fsReqType.release) {
                    delete this.reqHash[requestId];
                }
                if (reqObj.cb && typeof reqObj.cb === 'function') {
                    reqObj.cb(fileName);
                    // execute release if it in queue
                    // this.reqHash[requestId] = { ...reqObj, fileName };
                    // if (reqObj.releaseCb) {
                    //     this.release(
                    //         requestId,
                    //         typeof (reqObj.releaseCb) === 'function'
                    //             ? reqObj.releaseCb
                    //             : undefined);
                    // }
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
    public getLock(opts: requestMeta, cb: (fName: string) => void): string {
        let { requestId, fileName, ext, path } = opts;
        requestId = this.ensureRequestId(requestId);
        const action = fsReqType.lock;
        this.reqHash[requestId] = { cb, action, fileName, valid: typeof (fileName) === 'string' };
        transport.broadcastUniversally<IFSStoreReq>(this.reqName, { requestId, action, fileName, meta: { ext, path } });
        return requestId;
    }

    /**
     * acquire/request permission to write file - give CB for call with valid fileName 
     * @param cb - CB to call with resulting file name from server & plugins
     * @param options - an ID for find cb with resulting file name
     * @returns
     */
    public getAccess(opts: requestMeta, cb: (fName: string) => void): string {

        let { requestId, fileName, ext, path } = opts;
        requestId = this.ensureRequestId(requestId);
        const action = fsReqType.access;
        this.reqHash[requestId] = { cb, action, fileName, valid: typeof (fileName) === 'string' };
        transport.broadcastUniversally<IFSStoreReq>(this.reqName, { requestId, action, fileName, meta: { ext, path } });
        return requestId;
    }

    /**
     * acquire/request permission to write file - give CB for call with valid fileName 
     * @param cb - CB to call with resulting file name from server & plugins
     * @param options - an ID for find cb with resulting file name
     * @returns
     */
    public getUnlink(opts: requestMeta, cb: (fName: string) => void): string {

        let { requestId, fileName, ext, path } = opts;
        if (!fileName) {
            throw new Error('NO FileName giver for unlink permission request task');
        }
        requestId = this.ensureRequestId(requestId);
        const action = fsReqType.unlink;
        this.reqHash[requestId] = { cb, action, fileName, valid: true };
        transport
            .broadcastUniversally<IFSStoreReq>(this.reqName, { requestId, action, fileName, meta: { ext, path } });
        return requestId;
    }

    public release(requestId: string, cb?: () => void) {
        const curReqData = this.reqHash[requestId];
        if (!curReqData) {
            logger.error({ requestId }, 'NO request data for release');
            return false;
        }
        const { action, fileName, valid } = curReqData;
        logger.debug({ action, fileName, valid }, 'on release start');
        if (!valid) {
            this.reqHash[requestId].releaseCb = cb || true;
            return false;
        }
        const reqData: requestsTableItem = { action: fsReqType.release, valid, fileName };
        if (cb) {
            reqData.cb = cb;
        }
        this.reqHash[requestId] = reqData;

        logger.debug({ requestId, reqData }, 'on release');

        transport.broadcastUniversally<IFSStoreReq>(
            this.releaseReqName,
            {
                requestId,
                fileName,
                action: action as fsReqType,
                meta: {},
            });
        return true;
    }

    public releaseAllWorkerActions() {
        transport.broadcastUniversally(this.cleanReqName, {});
    }
}
