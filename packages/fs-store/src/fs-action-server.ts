/**
 * Que server - used to keep track of permissions for use of limited resources like FS write threads.
 * resources are labeled as strings and permissions are requested and released by special requests via transport! 
 */
import { IQueAcqReq, IQueAcqResp, IQueStateReq, IQueStateResp, ITransport } from '@testring/types';
import { transport } from '@testring/transport';
import { PluggableModule } from '@testring/pluggable-module';

import { LockPool, LockPoolHooks } from './utils';

import { FS_CONSTANTS, getNewLog } from './utils';

const logger = getNewLog({ m: 'fas' });
const { DW_ID } = FS_CONSTANTS;


enum serverState {
    'new' = 0,
    'initStarted',
    'initialized',
}

const hooks = {
    ON_RELEASE: 'onRelease',
};

export { hooks as fsActionServerHooks };

export class FSActionServer extends PluggableModule {

    private reqName: string;
    private resName: string;
    private releaseName: string;
    private cleanName: string;

    private stateReq: string;
    private stateResp: string;

    private unHookStateTransport: (() => void) | null = null;
    private unHookReqTransport: (() => void) | null = null;
    private unHookReleaseTransport: (() => void) | null = null;
    private unHookCleanWorkerTransport: (() => void) | null = null;
    private queue: LockPool;
    private IDs = {};

    private initState: serverState = serverState.new;
    private initEnsured: Promise<any>;
    private initialize: (any) => void;

    private msgNamePrefix: string;

    private transport: ITransport;

    constructor(maxWriteThreadCount: number = 10, msgNamePrefix: string = 'fs-que', tr: ITransport = transport) {
        super(Object.values(hooks));

        this.transport = tr;
        this.msgNamePrefix = msgNamePrefix;

        this.stateReq = msgNamePrefix + FS_CONSTANTS.FAS_REQ_ST_POSTFIX;
        this.stateResp = msgNamePrefix + FS_CONSTANTS.FAS_RESP_ST_POSTFIX;

        this.reqName = msgNamePrefix + FS_CONSTANTS.FAS_REQ_POSTFIX;
        this.resName = msgNamePrefix + FS_CONSTANTS.FAS_RESP_POSTFIX;
        this.releaseName = msgNamePrefix + FS_CONSTANTS.FAS_RELEASE_POSTFIX;
        this.cleanName = msgNamePrefix + FS_CONSTANTS.FAS_CLEAN_POSTFIX;

        this.queue = new LockPool(maxWriteThreadCount);
        this.initEnsured = new Promise(resolve => {
            this.initialize = resolve;
        });
        this.init();
    }

    public getMsgPrefix = () => this.msgNamePrefix;
    public getTransport = () => this.transport;

    public getInitState(): number {
        return this.initState;
    }

    public getState = () => this.queue.getState();

    private async init(): Promise<void> {
        // ensure init once
        if (this.initState !== serverState.new) {
            throw new Error('Cannot reinitialize component (queue server is singleton)');
        }
        this.initState = serverState.initStarted;

        const acqHook = this.queue.getHook(LockPoolHooks.ON_ACQUIRE);
        if (acqHook) {
            acqHook.readHook('queServerAcc', async ({ workerId, requestId }) => {
                logger.debug({ workerId, requestId }, 'inAcquire hook');
                this.send<IQueAcqResp>(workerId, this.resName, { requestId });
            });
        }
        const releaseHook = this.queue.getHook(LockPoolHooks.ON_RELEASE);
        if (releaseHook) {
            releaseHook.readHook('queServerRel', async ({ workerId, requestId }) => {
                logger.debug({ workerId, requestId }, 'inRelease hook');
                this.send<IQueAcqResp>(workerId, this.resName, { requestId });
            });
        }

        this.unHookStateTransport = this
            .transport.on<IQueStateReq>(this.stateReq, async ({ requestId }, workerId = '*') => {
                this.send<IQueStateResp>(workerId, this.stateResp, { requestId, state: this.getState() });
            });

        this.unHookReqTransport = this
            .transport.on<IQueAcqReq>(this.reqName, async ({ requestId }, workerId = '*') => {
                await this.initEnsured;
                logger.debug({ workerId, requestId }, 'request action');
                this.queue.acquire(workerId, requestId);
            });

        this.unHookReleaseTransport = this
            .transport.on<IQueAcqReq>(this.releaseName, ({ requestId }, workerId = '*') => {
                logger.debug({ workerId, requestId }, 'release action');
                this.callHook(hooks.ON_RELEASE, { workerId, requestId });
                this.queue.release(workerId, requestId);
            });

        this.unHookCleanWorkerTransport = this
            .transport.on<{}>(this.cleanName, (msgData, workerId = '*') => {
                logger.debug({ workerId }, 'clean worker actions');
                this.queue.clean(workerId);
            });

        this.initialize(true);
        this.initState = serverState.initialized;
    }

    private send<T>(workerId: string | undefined, msgId: string, data: T) {
        logger.debug({ workerId, msgId, data }, 'on send');
        if (!workerId || workerId === DW_ID) {
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

    public cleanUpTransport() {
        this.unHookStateTransport && this.unHookStateTransport();
        this.unHookReqTransport && this.unHookReqTransport();
        this.unHookReleaseTransport && this.unHookReleaseTransport();
        this.unHookCleanWorkerTransport && this.unHookCleanWorkerTransport();
    }

    public removeIDs(workerId: string, requestId: string | undefined) {
        const delKeys = Object.keys(this.IDs).filter((fName) => {
            const [wId, rId] = fName.split('-', 3);
            return workerId === wId && (!requestId || requestId === rId);
        });
        delKeys.forEach(fName => {
            delete this.IDs[fName];
        });
    }

    public removeID(fileName: string) {
        delete this.IDs[fileName];
    }
}
