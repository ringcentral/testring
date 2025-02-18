/**
 * An abstraction class to hide transport implementation
 */

import * as path from 'path';

import {generateUniqId} from '@testring/utils';
import {loggerClient} from '@testring/logger';
import {transport} from '@testring/transport';
import {
    fsReqType,
    IFSStoreReq,
    IFSStoreResp,
    requestMeta,
} from '@testring/types';

import {FS_CONSTANTS} from './utils';

const log = loggerClient.withPrefix('fsc');

type requestsTableItem = {
    action: fsReqType;
    cb?: (f: string, r: string | null | undefined) => void;
    meta: requestMeta;
    fullPath?: string; // fullFileName
};
type requestsTable = Record<string, requestsTableItem>;

export class FSStoreClient {
    private reqName: string;
    private respName: string;
    private releaseReqName: string;
    private cleanReqName: string;
    private reqHash: requestsTable = {};

    constructor(msgNamePrefix: string = FS_CONSTANTS.FS_DEFAULT_MSG_PREFIX) {
        this.reqName = msgNamePrefix + FS_CONSTANTS.FS_REQ_NAME_POSTFIX;
        this.respName = msgNamePrefix + FS_CONSTANTS.FS_RESP_NAME_POSTFIX;
        this.releaseReqName =
            msgNamePrefix + FS_CONSTANTS.FS_RELEASE_NAME_POSTFIX;
        this.cleanReqName =
            msgNamePrefix + FS_CONSTANTS.FS_CLEAN_REQ_NAME_POSTFIX;

        this.init();
    }

    private init() {
        // hook on response - get request Object according to requestID & call CB
        transport.on<IFSStoreResp>(this.respName, (msgData) => {
            const {requestId, fullPath, status, action} = msgData;
            const isOk = status === 'OK';
            if (!isOk) {
                log.error(
                    {
                        requestId,
                        fullPath,
                        status,
                        action,
                        reqHash: this.reqHash[requestId],
                    },
                    'status not OK',
                );
            }
            const reqObj = this.reqHash[requestId];
            if (reqObj) {
                if (isOk) {
                    if (reqObj.action === fsReqType.release) {
                        delete this.reqHash[requestId];
                    } else {
                        this.reqHash[requestId].fullPath = fullPath;
                        this.reqHash[requestId].meta.fileName =
                            path.basename(fullPath);
                    }
                }

                if (reqObj.cb && typeof reqObj.cb === 'function') {
                    reqObj.cb(fullPath, requestId);
                }
            }
            // FIX: if no reqObj found - possible race with release or miss on transport endpoint
        });
    }

    private ensureRequestId(requestId?: string) {
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
     * acquire/request permission to lock file (no delete possible until unlock) - give CB for call with valid fileName
     * @param meta - an ID for find cb with resulting file name
     * @param cb - CB to call with resulting file name from server & plugins
     * @returns
     */
    public getLock(
        meta: requestMeta,
        cb: (fName: string, requestId?: string) => void,
    ): string {
        const requestId = this.ensureRequestId();
        const action = fsReqType.lock;
        this.reqHash[requestId] = {
            cb,
            action,
            meta,
        };
        transport.broadcastUniversally<IFSStoreReq>(this.reqName, {
            requestId,
            action,
            meta,
        });
        return requestId;
    }

    /**
     * acquire/request permission to write file - give CB for call with valid fileName
     * @param meta - an ID for find cb with resulting file name
     * @param cb - CB to call with resulting file name from server & plugins
     * @returns
     */
    public getAccess(
        meta: requestMeta,
        cb: (fullPath: string, requestId?: string) => void,
    ): string {
        const requestId = this.ensureRequestId();
        const action = fsReqType.access;
        this.reqHash[requestId] = {
            cb,
            action,
            meta,
        };
        transport.broadcastUniversally<IFSStoreReq>(this.reqName, {
            requestId,
            action,
            meta,
        });
        return requestId;
    }

    /**
     * acquire/request permission to delete file (will wait for all locks) - give CB for call with valid fileName
     * @param meta - an ID for find cb with resulting file name
     * @param cb - CB to call with resulting file name from server & plugins
     * @returns
     */
    public getUnlink(
        meta: requestMeta,
        cb: (fName: string, requestId?: string) => void,
    ): string {
        const {fileName} = meta;
        if (!fileName) {
            throw new Error(
                'NO FileName given for unlink permission request task',
            );
        }
        const requestId = this.ensureRequestId();
        const action = fsReqType.unlink;
        this.reqHash[requestId] = {cb, action, meta};
        transport.broadcastUniversally<IFSStoreReq>(this.reqName, {
            requestId,
            action,
            meta,
        });
        return requestId;
    }

    public release(
        requestId: string,
        cb?: (fName: string, requestId?: string) => void,
    ) {
        const curReqData = this.reqHash[requestId];
        if (!curReqData) {
            log.warn({requestId}, 'NO request data for release action');
            return false;
        }
        const {action, fullPath, meta} = curReqData;
        const reqData: requestsTableItem = {
            action: fsReqType.release,
            fullPath,
            meta,
        };
        if (cb) {
            reqData.cb = cb;
        }
        this.reqHash[requestId] = reqData;

        transport.broadcastUniversally<IFSStoreReq>(this.releaseReqName, {
            requestId,
            action: action as fsReqType,
            meta,
        });
        return true;
    }

    public releaseAllWorkerActions() {
        transport.broadcastUniversally(this.cleanReqName, {});
    }
}
