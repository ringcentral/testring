import { ChildProcess } from 'child_process';

import {
    ITransport,
    IBrowserProxyController,
    IBrowserProxyCommand,
    IBrowserProxyCommandResponse,
    IBrowserProxyPendingCommand,
    BrowserProxyMessageTypes,
    BrowserProxyPlugins
} from '@testring/types';
import { PluggableModule } from '@testring/pluggable-module';
import { loggerClientLocal } from '@testring/logger';

const nanoid = require('nanoid');

export class BrowserProxyController extends PluggableModule implements IBrowserProxyController {
    constructor(
        private transportInstance: ITransport,
        private workerCreator: (onActionPluginPath: string, config: any) => ChildProcess,
    ) {
        super([
            BrowserProxyPlugins.getPlugin,
        ]);

        this.registerResponseListener();
    }

    private worker: ChildProcess;

    private workerId: string;

    private pendingCommandsQueue: Set<IBrowserProxyPendingCommand> = new Set();

    private pendingCommandsPool: Map<string, IBrowserProxyPendingCommand> = new Map();

    private registerResponseListener() {
        this.transportInstance.on(
            BrowserProxyMessageTypes.response,
            (response) => this.onCommandResponse(response),
        );

        this.transportInstance.on(BrowserProxyMessageTypes.exception, (error) => {
            this.kill();

            throw error;
        });
    }

    private onCommandResponse(commandResponse: IBrowserProxyCommandResponse): void {
        const { uid, response, exception } = commandResponse;
        const item = this.pendingCommandsPool.get(uid);

        if (item) {
            const { resolve, reject } = item;

            this.pendingCommandsPool.delete(uid);

            if (exception) {
                return reject(exception);
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
        delete this.workerId;

        loggerClientLocal.debug(
            'Browser Proxy controller: miss connection with child process',
            'code', code,
            'error', error
        );

        this.onProxyDisconnect();
        this.spawn();
    };

    private send(item: IBrowserProxyPendingCommand): void {
        const { command, applicant } = item;
        const uid = nanoid();

        this.pendingCommandsPool.set(uid, item);

        this.transportInstance.send(
            this.workerId,
            BrowserProxyMessageTypes.execute,
            {
                uid,
                command,
                applicant
            },
        );
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

        this.worker = this.workerCreator(externalPlugin.plugin, externalPlugin.config);

        this.workerId = `proxy-${this.worker.pid}`;

        this.worker.on('exit', this.onExit);

        this.worker.stdout.on('data', (message) => {
            loggerClientLocal.log(`[browser-proxy] [logged] ${message.toString()}`);
        });

        this.transportInstance.registerChildProcess(this.workerId, this.worker);

        this.onProxyConnect();

        loggerClientLocal.debug(`Browser Proxy controller: register child process [id = ${this.workerId}]`);

        return this.worker.pid;
    }

    public execute(applicant: string, command: IBrowserProxyCommand): Promise<void> {
        return new Promise((resolve, reject) => {
            const item: IBrowserProxyPendingCommand = {
                resolve,
                reject,
                command,
                applicant
            };

            if (this.worker && this.worker.connected) {
                this.send(item);
            } else {
                this.pendingCommandsQueue.add(item);
            }
        });
    }

    public kill(): void {
        if (this.worker) {
            this.worker.removeListener('exit', this.onExit);
            this.worker.kill();
        }
    }
}
