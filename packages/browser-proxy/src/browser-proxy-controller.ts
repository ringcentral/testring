import { ChildProcess } from 'child_process';

import {
    ITransport,
    IBrowserProxyController,
    IBrowserProxyCommand,
    IBrowserProxyCommandResponse,
    IBrowserProxyPendingCommand,
    BrowserProxyMessageTypes,
    BrowserProxyPlugins,
    BrowserProxyActions
} from '@testring/types';
import { PluggableModule } from '@testring/pluggable-module';
import { loggerClientLocal } from '@testring/logger';

const nanoid = require('nanoid');

export class BrowserProxyController extends PluggableModule implements IBrowserProxyController {
    constructor(
        private transport: ITransport,
        private workerCreator: (onActionPluginPath: string, config: any) => ChildProcess | Promise<ChildProcess>
    ) {
        super([ BrowserProxyPlugins.getPlugin ]);

        this.registerResponseListener();
    }

    private worker: ChildProcess;

    private workerID: string;

    private pendingCommandsQueue: Set<IBrowserProxyPendingCommand> = new Set();

    private pendingCommandsPool: Map<string, IBrowserProxyPendingCommand> = new Map();

    private registerResponseListener() {
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
            loggerClientLocal.error(`Browser Proxy controller: cannot find command with uid ${uid}`);

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

        loggerClientLocal.debug(
            'Browser Proxy controller: miss connection with child process',
            'code', code,
            'error', error
        );

        this.onProxyDisconnect();
        this.spawn();
    };

    private send(item: IBrowserProxyPendingCommand): void {
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
            loggerClientLocal.error(err);
        });
    }

    public async spawn(): Promise<number> {
        if (typeof this.workerCreator !== 'function') {
            loggerClientLocal.error(`Unsupported worker type "${typeof this.workerCreator}"`);
            throw new Error(`Unsupported worker type "${typeof this.workerCreator}"`);
        }

        const externalPlugin = await this.callHook(BrowserProxyPlugins.getPlugin, {
            plugin: 'unknown',
            config: null
        });

        this.worker = await this.workerCreator(externalPlugin.plugin, externalPlugin.config);

        this.workerID = `proxy-${this.worker.pid}`;

        this.worker.on('exit', this.onExit);

        this.worker.stdout.on('data', (message) => {
            loggerClientLocal.log(`[browser-proxy] [logged] ${message.toString()}`);
        });

        this.transport.registerChildProcess(this.workerID, this.worker);

        this.onProxyConnect();

        loggerClientLocal.debug(`Browser Proxy controller: register child process [id = ${this.workerID}]`);

        return this.worker.pid;
    }

    public execute(applicant: string, command: IBrowserProxyCommand): Promise<void> {
        return new Promise((resolve, reject) => {
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
        await this.execute('root', {
            action: BrowserProxyActions.kill,
            args: []
        });

        if (this.worker) {
            this.worker.removeListener('exit', this.onExit);
            this.worker.kill();
        }
    }
}
