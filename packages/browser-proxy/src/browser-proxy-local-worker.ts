import {
    BrowserProxyActions,
    BrowserProxyMessageTypes,
    IBrowserProxyCommand,
    IBrowserProxyCommandResponse,
    IBrowserProxyPendingCommand,
    IBrowserProxyWorker,
    IBrowserProxyWorkerConfig,
    ITransport,
} from '@testring/types';
import {generateUniqId} from '@testring/utils';
import {loggerClient} from '@testring/logger';
import {BrowserProxy} from './browser-proxy/browser-proxy';

export class BrowserProxyLocalWorker implements IBrowserProxyWorker {
    private pendingCommandsPool: Map<string, IBrowserProxyPendingCommand> = new Map();
    protected browserProxy: BrowserProxy;
    private logger = loggerClient.withPrefix('[browser-proxy-local-worker]');
    private workerID = `proxy-local-${generateUniqId()}`;
    private removeHandlers: Array<() => void> = [];

    constructor(
        private transport: ITransport,
        private spawnConfig: IBrowserProxyWorkerConfig,
    ) {
        this.browserProxy = new BrowserProxy(this.transport, this.spawnConfig.plugin, this.spawnConfig.config);
        this.registerTransportHandlers();
    }

    private registerTransportHandlers(): void {
        this.removeHandlers.push(this.transport.on(BrowserProxyMessageTypes.response, (response, source) => {
            this.onCommandResponse(response);
        }));

        this.removeHandlers.push(this.transport.on(BrowserProxyMessageTypes.exception, (error, source) => {
            this.kill().catch((err) => this.logger.error(err));
            throw error;
        }));
    }

    private onCommandResponse(commandResponse: IBrowserProxyCommandResponse): void {
        const {uid, response, error} = commandResponse;
        const item = this.pendingCommandsPool.get(uid);

        if (item) {
            const {resolve, reject} = item;
            this.pendingCommandsPool.delete(uid);
            error ? reject(error) : resolve(response);
        } else {
            this.logger.error(`Cannot find command with uid ${uid}`);
            throw new ReferenceError(`Cannot find command with uid ${uid}`);
        }
    }

    private async send(item: IBrowserProxyPendingCommand) {
        const {command, applicant, uid} = item;
        this.pendingCommandsPool.set(uid, item);
        this.transport.broadcastUniversally(BrowserProxyMessageTypes.execute, {
            uid,
            command,
            applicant,
        });
    }

    public async spawn(): Promise<void> {
        this.logger.debug(`Local browser proxy worker spawned with ID: ${this.workerID}`);
    }

    public async execute(applicant: string, command: IBrowserProxyCommand): Promise<any> {
        return new Promise((resolve, reject) => {
            const uid = generateUniqId();
            const item: IBrowserProxyPendingCommand = {
                uid,
                resolve,
                reject,
                command,
                applicant,
            };
            this.send(item);
        });
    }

    public async kill(): Promise<void> {
        await this.execute('root', { action: BrowserProxyActions.kill, args: [] });
        this.removeHandlers.forEach((removeHandler) => removeHandler());
        this.removeHandlers = [];
        this.browserProxy.removeHandlers.forEach((removeHandler) => removeHandler());
        this.browserProxy.removeHandlers = [];
        this.logger.debug(`BrowserProxyLocalWorker with ID ${this.workerID} terminated.`);
    }
}
