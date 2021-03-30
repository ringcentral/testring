/**
 * An abstraction class to hide transport implementation 
 */

import { generateUniqId } from '@testring/utils';
import { transport } from '@testring/transport';

import {
    ICollectionFilterRequestData,
    ICollectionFilterResponseData,
    ICollectionConfirmationData,
    ICollectionConfirmationResult,
    ITransport,
    IQueStateReq,
    IQueStateResp,
} from '@testring/types';

import { FS_CONSTANTS, logger } from './utils';

const log = logger.getNewLog({ m: 'colc' });

type requestsTableItem = {
    cb?: ((response?: any, rId?: string) => void);
}
type requestsTable = Record<string, requestsTableItem>;

export class FSCollectionClient {

    private filterReqName: string;
    private filterRespName: string;
    private confirmReq: string;
    private confirmResp: string;

    private stateReq: string;
    private stateResp: string;

    private requestsInWork: requestsTable = {};

    private transport: ITransport;

    constructor(private msgNamePrefix: string = FS_CONSTANTS.FS_DEFAULT_COLLECTION_PREFIX, tr: ITransport = transport) {

        this.transport = tr;
        this.stateReq = msgNamePrefix + FS_CONSTANTS.FS_COL_REQ_ST_POSTFIX;
        this.stateResp = msgNamePrefix + FS_CONSTANTS.FAS_COL_RESP_ST_POSTFIX;

        this.filterReqName = msgNamePrefix + FS_CONSTANTS.FS_COL_FILTER_REQ_POSTFIX;
        this.filterRespName = msgNamePrefix + FS_CONSTANTS.FS_COL_FILTER_RESP_POSTFIX;
        this.confirmReq = msgNamePrefix + FS_CONSTANTS.FS_COL_CONFIRM_REQ_POSTFIX;
        this.confirmResp = msgNamePrefix + FS_CONSTANTS.FS_COL_CONFIRM_RESP_POSTFIX;

        this.init();
    }

    getPrefix = () => this.msgNamePrefix;

    private init() {

        // hook on response - get request Object according to requestID & call CB 
        this.transport.on<ICollectionFilterResponseData>(this.filterRespName, ({ requestId, filtered }) => {
            const rData = this.requestsInWork[requestId];
            if (!rData) {
                log.warn({ requestId, rData, inWork: this.requestsInWork }, 'no client is waiting for filter response');
                return;
            }
            delete this.requestsInWork[requestId];
            rData.cb && rData.cb({ filtered }, requestId);
        });

        // hook on response - get request Object according to requestID & call CB
        this.transport.on<ICollectionConfirmationResult>(this.confirmResp, ({ requestId, loaded }) => {
            const rData = this.requestsInWork[requestId];
            if (!rData) {
                log.warn({ requestId, rData, inWork: this.requestsInWork }, 'no client is waiting for filter response');
                return;
            }
            delete this.requestsInWork[requestId];
            rData.cb && rData.cb(loaded, requestId);
        });

        this.transport.on<IQueStateResp>(this.stateResp, ({ requestId, state }) => {
            const rData = this.requestsInWork[requestId];
            if (!rData) {
                log.warn({ requestId, rData }, 'no client is waiting for state response');
                return;
            }
            delete this.requestsInWork[requestId];
            rData.cb && rData.cb(state, requestId);
        });
    }

    private ensureRequestId(requestId?: string | null | undefined) {
        if (!requestId || requestId === '') {
            requestId = generateUniqId(10);
            while (this.requestsInWork[requestId]) {
                requestId = generateUniqId(10);
            }
        } else {
            if (this.requestsInWork[requestId]) {
                throw new Error('Not uniq requestId given!');
            }
        }
        return requestId;
    }

    /**
     * 
     * @returns - client state
     */
    public getState(): Record<string, any> {
        const state: Record<string, any> = {};
        state.inWork = Object.keys(this.requestsInWork);
        return state;
    }

    /**
     * request server state 
     * 
     * @param [cb] - CB to call with resulting data, if omitted the promise is returned that resolves to server state
     * @returns - string of request Id or promise resolved to server state
     */
    public getServerState(cb?: (state: Record<string, any>, requestId: string) => void): string | Promise<string[]> {

        const requestId = this.ensureRequestId();

        if (cb) {
            this.requestsInWork[requestId] = { cb };
            this.transport.broadcastUniversally<IQueStateReq>(this.stateReq, { requestId });
            return requestId;
        }
        return new Promise((res) => {
            this.requestsInWork[requestId] = { cb: (state) => res(state) };
            this.transport.broadcastUniversally<IQueStateReq>(this.stateReq, { requestId });
        });

    }

    /**
     * confirm/fill server uniq collection 
     * 
     * @param fillArray - an array of urls for file existing on the server
     * @param collectionId - a string Id (git hash) to identify loading of urls
     * @param [getResult] - a flag to return resulting collection 
     * @param [cb] - CB to call with resulting data, if omitted the promise is returned that resolves to server state
     * @returns - string of request Id or promise resolved to server state
     */
    public confirmLoad(fillArray: string[], collectionId: string, getResult?: boolean,
        cb?: (state: Record<string, any>, requestId: string) => void): string | Promise<string[]> {

        const requestId = this.ensureRequestId();

        if (cb) {
            this.requestsInWork[requestId] = { cb };
            this.transport
                .broadcastUniversally<ICollectionConfirmationData>(
                    this.confirmReq,
                    { requestId, collectionId, loaded: fillArray, getResult });
            return requestId;
        }
        return new Promise((res) => {
            this.requestsInWork[requestId] = { cb: res };
            this.transport
                .broadcastUniversally<ICollectionConfirmationData>(
                    this.confirmReq,
                    { requestId, collectionId, loaded: fillArray, getResult });
        });
    }

    /**
     * confirm/fill server uniq collection 
     * 
     * @param filterArray - an array of urls to filter against server store data
     * @param collectionId - a string Id (git hash) to identify loading of urls
     * @param [cb] - CB to call with resulting data, if omitted the promise is returned that resolves to server state
     * @returns - string of request Id or promise resolved to server state
     */
    public filter(filterArray: string[], collectionId: string,
        cb?: (state: Record<string, any>, requestId: string) => void): string | Promise<{ filtered: string[] }> {

        const requestId = this.ensureRequestId();

        if (cb) {
            this.requestsInWork[requestId] = { cb };
            this.transport
                .broadcastUniversally<ICollectionFilterRequestData>(
                    this.filterReqName,
                    { requestId, collectionId, filterArray });
            return requestId;
        }
        return new Promise((res) => {
            this.requestsInWork[requestId] = { cb: res };
            this.transport
                .broadcastUniversally<ICollectionFilterRequestData>(
                    this.filterReqName,
                    { requestId, collectionId, filterArray });
        });

    }


}
