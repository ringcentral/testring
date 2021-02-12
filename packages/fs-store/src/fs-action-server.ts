/**
 * Que server - used to keep track of permissions for use of limited resources like FS write threads.
 * resources are labeled as strings and permissions are requested and released by special requests via transport! 
 */
import { IQueAcqReq, IQueAcqResp, IQueTestReq, IQueTestResp, ITransport } from '@testring/types';
import { generateUniqId } from '@testring/utils';
import { transport } from '@testring/transport';
import { PluggableModule } from '@testring/pluggable-module';


import { FSQueue, hooks as queHooks } from './fs-queue';


import { FS_CONSTANTS } from './utils';

const { DW_ID } = FS_CONSTANTS;


enum serverState {
    'new' = 0,
    'initStarted',
    'initialized',
}

const hooks = {
    ON_FILENAME: 'onFileName',
    ON_RELEASE: 'onRelease',
};

export { hooks as fsQueueServerHooks };

export class FSActionServer extends PluggableModule {

    private reqName: string;
    private resName: string;
    private releaseName: string;
    private cleanName: string;
    private testReq: string;
    private testResp: string;
    private unHookTestTransport: (() => void) | null = null;
    private unHookReqTransport: (() => void) | null = null;
    private unHookReleaseTransport: (() => void) | null = null;
    private unHookCleanWorkerTransport: (() => void) | null = null;
    private queue: FSQueue;
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
        this.testReq = msgNamePrefix + '_test';
        this.testResp = msgNamePrefix + '_test_resp';

        this.reqName = msgNamePrefix + FS_CONSTANTS.FAS_REQ_POSTFIX;
        this.resName = msgNamePrefix + FS_CONSTANTS.FAS_RESP_POSTFIX;
        this.releaseName = msgNamePrefix + FS_CONSTANTS.FAS_RELEASE_POSTFIX;
        this.cleanName = msgNamePrefix + FS_CONSTANTS.FAS_CLEAN_POSTFIX;

        this.queue = new FSQueue(maxWriteThreadCount);
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

    private async init(): Promise<void> {
        // ensure init once
        if (this.initState !== serverState.new) {
            throw new Error('Cannot reinitialize component (queue server is singleton)');
        }
        this.initState = serverState.initStarted;

        const acqHook = this.queue.getHook(queHooks.ON_ACQUIRE);
        if (acqHook) {
            acqHook.readHook('queServer', async ({ workerId, requestId }) => {
                const id = await this.generateUniqID(workerId, requestId);
                this.send<IQueAcqResp>(workerId, this.resName, { requestId, id });
            });
        }

        this.unHookTestTransport = this
            .transport.on<IQueTestReq>(this.testReq, async ({ requestId }, workerId = '*') => {
                this.send<IQueTestResp>(workerId, this.testResp, { requestId, state: `${this.initState}` });
            });

        this.unHookReqTransport = this
            .transport.on<IQueAcqReq>(this.reqName, async ({ requestId }, workerId = '*') => {
                await this.initEnsured;
                // console.log('fas req initEnsured', workerId, requestId, Date.now());
                this.queue.acquire(workerId, requestId);
            });

        this.unHookReleaseTransport = this
            .transport.on<IQueAcqReq>(this.releaseName, ({ requestId }, workerId = '*') => {
                this.callHook(hooks.ON_RELEASE, { workerId, requestId });
                this.queue.release(workerId, requestId);
            });

        this.unHookCleanWorkerTransport = this
            .transport.on<{}>(this.cleanName, (msgData, workerId = '*') => {
                this.queue.clean(workerId);
            });

        this.initialize(true);
        this.initState = serverState.initialized;
    }

    private send<T>(workerId: string | undefined, msgId: string, data: T) {
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
        this.unHookTestTransport && this.unHookTestTransport();
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

    private async generateUniqID(workerId: string, requestId: string, ext = 'png') {
        const screenDate = new Date();
        const formattedDate = (`${screenDate.toLocaleTimeString()} ${screenDate.toDateString()}`)
            .replace(/\s+/g, '_');

        const id = `${generateUniqId(5)}-${formattedDate}`;

        if (this.IDs[id]) {
            // eslint-disable-next-line ringcentral/specified-comment-with-task-id
            // FIXME: possible loop hence plugins can return same file name during every request
            return this.generateUniqID(workerId, ext);
        }
        this.IDs[id] = workerId;
        return id;
    }
}
