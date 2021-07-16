/**
 * An abstraction class to hide transport implementation
 */

import {generateUniqId} from '@testring/utils';
import {loggerClient} from '@testring/logger';
import {transport} from '@testring/transport';

import {
    IQueAcqReq,
    IQueAcqResp,
    IQueStateReq,
    IQueStateResp,
    ITransport,
} from '@testring/types';

import {FS_CONSTANTS} from './utils';

const log = loggerClient.withPrefix('fac');

type requestsTableItem = {
    cb?: (rId: string, state?: Record<string, any>) => void;
};
type requestsTable = Record<string, requestsTableItem>;

export class FSActionClient {
    private reqName: string;
    private resName: string;
    private releaseReqName: string;
    private releaseRespName: string;
    private cleanReqName: string;

    private stateReq: string;
    private stateResp: string;

    private requestInWork: requestsTable = {};

    private transport: ITransport;

    constructor(
        private msgNamePrefix: string = FS_CONSTANTS.FS_DEFAULT_QUEUE_PREFIX,
        tr: ITransport = transport,
    ) {
        this.transport = tr;
        this.stateReq = msgNamePrefix + FS_CONSTANTS.FAS_REQ_ST_POSTFIX;
        this.stateResp = msgNamePrefix + FS_CONSTANTS.FAS_RESP_ST_POSTFIX;

        this.reqName = msgNamePrefix + FS_CONSTANTS.FAS_REQ_POSTFIX;
        this.resName = msgNamePrefix + FS_CONSTANTS.FAS_RESP_POSTFIX;
        this.releaseReqName = msgNamePrefix + FS_CONSTANTS.FAS_RELEASE_POSTFIX;
        this.releaseRespName =
            msgNamePrefix + FS_CONSTANTS.FAS_RELEASE_RESP_POSTFIX;
        this.cleanReqName = msgNamePrefix + FS_CONSTANTS.FAS_CLEAN_POSTFIX;

        this.init();
    }

    getPrefix = () => this.msgNamePrefix;

    private init() {
        // hook on response - get request Object according to requestID & call CB
        this.transport.on<IQueStateResp>(
            this.stateResp,
            ({requestId, state}) => {
                const reqObj = this.requestInWork[requestId];
                if (reqObj) {
                    delete this.requestInWork[requestId];
                    if (reqObj.cb && typeof reqObj.cb === 'function') {
                        reqObj.cb && reqObj.cb(requestId, state);
                    }
                } else {
                    log.warn({rId: requestId}, 'NO object for requestId');
                }
            },
        );

        this.transport.on<IQueAcqResp>(this.resName, ({requestId}) => {
            const reqObj = this.requestInWork[requestId];
            if (reqObj) {
                if (reqObj.cb && typeof reqObj.cb === 'function') {
                    reqObj.cb(requestId);
                }
            } else {
                log.warn({rId: requestId}, 'NO object for requestId');
            }
        });

        this.transport.on<IQueAcqResp>(this.releaseRespName, ({requestId}) => {
            const reqObj = this.requestInWork[requestId];
            if (reqObj) {
                delete this.requestInWork[requestId];
                if (reqObj.cb && typeof reqObj.cb === 'function') {
                    reqObj.cb(requestId);
                }
            } else {
                log.warn({rId: requestId}, 'NO object for requestId');
            }
        });
    }

    private ensureRequestId(requestId: string | null | undefined) {
        if (!requestId || requestId === '') {
            requestId = generateUniqId(10);
            while (this.requestInWork[requestId]) {
                requestId = generateUniqId(10);
            }
        } else {
            if (this.requestInWork[requestId]) {
                throw new Error('Not uniq requestId given!');
            }
        }
        return requestId;
    }

    /**
     * acquire/request permission for action - give CB
     * @param reqName - request Name - type of request to server
     * @param requestId - requestId
     * @param cb - CB to call with resulting data
     * @returns
     */
    private getServerData(
        reqName: string,
        requestId: string | null,
        cb: (rId: string, state?: Record<string, any>) => void,
    ): string {
        requestId = this.ensureRequestId(requestId);
        this.requestInWork[requestId] = {cb};
        this.transport.broadcastUniversally<IQueStateReq>(reqName, {requestId});
        return requestId;
    }

    /**
     * acquire/request permission for action - give CB
     * @param rId - requestId
     * @param cb - CB to call with resulting data
     * @returns
     */
    public getState(
        rId: string | null,
        cb: (rId: string, state: Record<string, any>) => void,
    ): string {
        return this.getServerData(this.stateReq, rId, cb);
    }

    /**
     * acquire/request permission for action - give CB
     * @param rId - requestId
     * @param cb - CB to call as permission was acquired
     * @returns
     */
    public getThread(rId: string | null, cb: (dId: string) => void): string {
        return this.getServerData(this.reqName, rId, cb);
    }

    public release(requestId: string, cb?: () => void) {
        const curReqData = this.requestInWork[requestId];
        if (!curReqData) {
            log.error({rId: requestId}, 'NO request data for release');
            return false;
        }
        const reqData: requestsTableItem = {};
        if (cb) {
            reqData.cb = cb;
        }
        this.requestInWork[requestId] = reqData;

        log.debug({requestId, reqData}, 'on release');

        this.transport.broadcastUniversally<IQueAcqReq>(this.releaseReqName, {
            requestId,
        });
        return true;
    }

    public releaseAllWorkerActions() {
        this.transport.broadcastUniversally(this.cleanReqName, {});
    }

    public promisedThread(limit = 0): Promise<string> {
        return new Promise((res, rej) => {
            let to: NodeJS.Timeout | number;
            let rId = '';
            if (limit) {
                to = setTimeout(() => {
                    rej('');
                    this.release(rId);
                }, limit);
            }
            rId = this.getThread(null, (threadRId: string) => {
                if (to) {
                    clearTimeout(to as NodeJS.Timeout);
                }
                res(threadRId);
            });
        });
    }
    public releasePromisedThread(rId: string): Promise<void> {
        return new Promise((res, rej) => {
            this.release(rId, () => {
                res();
            });
        });
    }
}
