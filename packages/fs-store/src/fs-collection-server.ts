/**
 * An abstraction class to hide transport implementation 
 */

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

import { FS_CONSTANTS } from './utils';

export class FSCollectionServer {

    private reqName: string;
    private resName: string;
    private confirmReq: string;
    private confirmResp: string;

    private stateReq: string;
    private stateResp: string;

    private transport: ITransport;
    private unHookReqTransport: (() => void) | null = null;
    private unHookConfirmTransport: (() => void) | null = null;
    private unHookStateTransport: (() => void) | null = null;


    private collections: Record<string, Record<string, boolean>> = {};


    constructor(private msgNamePrefix: string = FS_CONSTANTS.FS_DEFAULT_COLLECTION_PREFIX, tr: ITransport = transport) {

        this.transport = tr;
        this.stateReq = msgNamePrefix + FS_CONSTANTS.FS_COL_REQ_ST_POSTFIX;
        this.stateResp = msgNamePrefix + FS_CONSTANTS.FS_COL_RESP_ST_POSTFIX;

        this.reqName = msgNamePrefix + FS_CONSTANTS.FS_COL_FILTER_REQ_POSTFIX;
        this.resName = msgNamePrefix + FS_CONSTANTS.FS_COL_FILTER_RESP_POSTFIX;
        this.confirmReq = msgNamePrefix + FS_CONSTANTS.FS_COL_CONFIRM_REQ_POSTFIX;
        this.confirmResp = msgNamePrefix + FS_CONSTANTS.FS_COL_CONFIRM_RESP_POSTFIX;

        this.init();
    }

    getPrefix = () => this.msgNamePrefix;

    private init() {

        // hook on response - get request Object according to requestID & call CB 
        this.unHookReqTransport = this.transport
            .on<ICollectionFilterRequestData>(this.reqName,
                ({ requestId, collectionId, filterArray }, workerId = FS_CONSTANTS.DW_ID) => {
                    if (!this.collections[collectionId]) {
                        this.collections[collectionId] = {};
                    }
                    const loaded = this.collections[collectionId];
                    const filtered = filterArray.filter((id) => !loaded[id]);
                    this.send<ICollectionFilterResponseData>(
                        workerId,
                        this.resName,
                        { requestId, collectionId, filtered });
                });

        this.unHookConfirmTransport = this.transport
            .on<ICollectionConfirmationData>(this.confirmReq,
                ({ requestId, collectionId, loaded, getResult }, workerId) => {
                    if (!this.collections[collectionId]) {
                        this.collections[collectionId] = {};
                    }
                    const loadedCol = this.collections[collectionId];
                    loaded.forEach(fUrl => {
                        loadedCol[fUrl] = true;
                    });
                    const loadedRes = getResult ? Object.keys(loadedCol) : null;
                    this.send<ICollectionConfirmationResult>(
                        workerId,
                        this.confirmResp,
                        { requestId, loaded: loadedRes });

                });

        this.unHookStateTransport = this.transport
            .on<IQueStateReq>(this.stateReq,
                ({ requestId }, workerId = FS_CONSTANTS.DW_ID) => {
                    const state: Record<string, any> = {};
                    state.collAm = Object.keys(this.collections).length;
                    state.collLengths = Object.keys(this.collections)
                        .reduce((result, key) => {
                            result[key] = Object.keys(this.collections[key]).length;
                            return result;
                        }, {});
                    this.send<IQueStateResp>(workerId, this.stateResp, { requestId, state });

                });

    }

    public cleanUpTransport() {
        this.unHookReqTransport && this.unHookReqTransport();
        this.unHookConfirmTransport && this.unHookConfirmTransport();
        this.unHookStateTransport && this.unHookStateTransport();
    }

    private send<T>(workerId: string | undefined, msgId: string, data: T) {
        if (!workerId || workerId === FS_CONSTANTS.DW_ID) {
            this.transport.broadcastUniversally<T>(
                msgId,
                data);
        } else {
            this.transport.send<T>(
                workerId,
                msgId,
                data);
        }
    }
}
