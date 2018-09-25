import { ChildProcess } from 'child_process';
import {
    BrowserProxyActions,
    BrowserProxyMessageTypes,
    IBrowserProxyCommand,
    IBrowserProxyCommandResponse,
    IBrowserProxyPendingCommand,
    IBrowserProxyWorker,
    ITransport,
} from '@testring/types';

import { loggerClientLocal } from '@testring/logger';

const nanoid = require('nanoid');

const logger = loggerClientLocal.getLogger('[browser-proxy-worker]');

export class BrowserProxyWorker implements IBrowserProxyWorker {
    private pendingCommandsQueue: Set<IBrowserProxyPendingCommand> = new Set();

    private pendingCommandsPool: Map<string, IBrowserProxyPendingCommand> = new Map();

    private spawnPromise: Promise<void> | null = null;

    private workerPID: number | null = null;

    private worker: ChildProcess | null = null;

    private workerID: string;

    private logger = logger;

    constructor(
        private transport: ITransport,
        private workerCreator: (onActionPluginPath: string, config: any) => ChildProcess | Promise<ChildProcess>,
        private spawnConfig: { plugin: string, config: any },
    ) {
        this.registerResponseListener();
    }

    private registerResponseListener(): void {
        this.transport.on(
            BrowserProxyMessageTypes.response,
            (response) => this.onCommandResponse(response)
        );

        this.transport.on(BrowserProxyMessageTypes.exception, (error) => {
            this.kill();

            throw error;
        });
    }

    private onCommandResponse(commandResponse: IBrowserProxyCommandResponse): void {
        const { uid, response, error } = commandResponse;

        const item = this.pendingCommandsPool.get(uid);

        if (item) {
            const { resolve, reject } = item;

            this.pendingCommandsPool.delete(uid);

            if (error) {
                return reject(error);
            }

            return resolve(response);
        } else {
            this.logger.error(`Browser Proxy controller: cannot find command with uid ${uid}`);

            throw new ReferenceError(`Cannot find command with uid ${uid}`);
        }
    }

    private onProxyConnect(): void {
        this.pendingCommandsQueue.forEach((item) => this.send(item));
        this.pendingCommandsQueue.clear();
    }

    private onProxyDisconnect(): void {
        this.pendingCommandsPool.forEach((item) => this.pendingCommandsQueue.add(item));
        this.pendingCommandsPool.clear();
    }

    private onExit = (code, error): void => {
        delete this.workerID;

        this.logger.debug(
            'Browser Proxy controller: miss connection with child process',
            'code', code,
            'error', error
        );


        this.onProxyDisconnect();
        this.spawn().catch((err) => {
            this.logger.error(err);
        });
    };

    private async send(item: IBrowserProxyPendingCommand) {
        const { command, applicant, uid } = item;

        this.pendingCommandsPool.set(uid, item);

        this.transport.send(
            this.workerID,
            BrowserProxyMessageTypes.execute,
            {
                uid,
                command,
                applicant
            }
        ).catch((err) => {
            this.logger.error(err);
        });
    }

    public getProcessID(): number | null {
        if (typeof this.workerPID === 'number') {
            return this.workerPID;
        }

        return null;
    }

    public async spawn(): Promise<void> {
        const {
            plugin,
            config,
        } = this.spawnConfig;

        let spawnResolver;
        this.spawnPromise = new Promise<void>((resolve) => spawnResolver = resolve);

        this.worker = await this.workerCreator(plugin, config);
        this.workerPID = this.worker.pid;
        this.workerID = `proxy-${this.worker.pid}`;

        this.worker.on('exit', this.onExit);

        this.worker.stdout.on('data', (message) => {
            this.logger.log(`[logged] ${message.toString()}`);
        });

        this.transport.registerChildProcess(this.workerID, this.worker);

        this.onProxyConnect();

        this.logger.debug(`Browser Proxy controller: register child process [id = ${this.workerID}]`);

        this.spawnPromise = null;
        spawnResolver();
    }

    public async execute(applicant: string, command: IBrowserProxyCommand): Promise<void> {
        if (this.worker === null) {
            await this.spawn();
        }

        await new Promise((resolve, reject) => {
            const uid = nanoid();
            const item: IBrowserProxyPendingCommand = {
                uid,
                resolve,
                reject,
                command,
                applicant
            };

            if (this.worker) {
                this.send(item);
            } else {
                this.pendingCommandsQueue.add(item);
            }
        });
    }

    public async kill(): Promise<void> {
        await this.spawnPromise;

        if (this.worker) {
            await this.execute('root', {
                action: BrowserProxyActions.kill,
                args: [],
            });

            this.worker.removeListener('exit', this.onExit);
            this.worker.kill();
        }
    }
}
