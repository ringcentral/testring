import {
    DevtoolPluginHooks,
    DevtoolProxyMessages,
    DevtoolWorkerMessages,
    IChildProcessFork,
    IDevtoolProxyMessage,
    IDevtoolRuntimeConfiguration,
    IDevtoolServerConfig,
    IDevtoolServerController,
    ITransport,
    TestWorkerAction,
    WebApplicationDevtoolActions,
} from '@testring/types';

import * as path from 'path';

import { fork } from '@testring/child-process';
import { generateUniqId } from '@testring/utils';
import { PluggableModule } from '@testring/pluggable-module';
import { loggerClient } from '@testring/logger';
import { defaultDevtoolConfig } from './default-devtool-config';

import { extensionId } from '@testring/devtool-extension';


export class DevtoolServerController extends PluggableModule implements IDevtoolServerController {

    private workerID: string;

    private worker: IChildProcessFork;

    private logger = loggerClient.withPrefix('[recorder-server]');

    private config: IDevtoolServerConfig;

    constructor(private transport: ITransport) {
        super([
            DevtoolPluginHooks.beforeStart,
            DevtoolPluginHooks.afterStart,
            DevtoolPluginHooks.beforeStop,
            DevtoolPluginHooks.afterStop,
        ]);
    }

    private getConfig(): IDevtoolServerConfig {
        return defaultDevtoolConfig;
    }

    public getRuntimeConfiguration(): IDevtoolRuntimeConfiguration {
        if (this.config === undefined) {
            throw Error('Configuration is not initialized yet');
        } else {
            const {
                httpPort,
                wsPort,
                host,
            } = this.config;

            return {
                extensionId,
                httpPort,
                wsPort,
                host,
            };
        }
    }

    private getWorkerID(): string {
        if (!this.workerID) {
            this.workerID = `recorder/${generateUniqId()}`;
        }
        return this.workerID;
    }

    private async startServer() {
        const workerPath = path.resolve(__dirname, 'worker');
        const workerID = this.getWorkerID();

        this.worker = await fork(workerPath);

        this.worker.stdout?.on('data', (data) => {
            this.logger.log(`[logged] ${data.toString().trim()}`);
        });

        this.worker.stderr?.on('data', (data) => {
            this.logger.warn(`[logged] ${data.toString().trim()}`);
        });

        this.transport.registerChild(workerID, this.worker);

        this.logger.debug(`Registered child process ${workerID}`);
    }

    private async stopServer() {
        this.worker.kill();
    }

    private addToServerProxyHandler(messageType) {
        const toServerHandler = (messageData, processID: string | null = null) => {
            this.transport.send<IDevtoolProxyMessage>(this.getWorkerID(), DevtoolProxyMessages.TO_WORKER, {
                source: processID,
                messageType,
                messageData,
            });
        };
        this.transport.on(messageType, toServerHandler);
    }

    private handleProxiedMessage(message: IDevtoolProxyMessage) {
        if (message.source) {
            this.transport.send(message.source as string, message.messageType, message.messageData);
        } else {
            this.transport.broadcastLocal(message.messageType, message.messageData);
        }
    }

    private initMessagesProxy() {
        [
            TestWorkerAction.register,
            TestWorkerAction.updateExecutionState,
            TestWorkerAction.unregister,

            WebApplicationDevtoolActions.register,
            WebApplicationDevtoolActions.unregister,

        ].forEach((event) => this.addToServerProxyHandler(event));

        this.transport.on<IDevtoolProxyMessage>(DevtoolProxyMessages.FROM_WORKER, (payload) => {
            this.handleProxiedMessage(payload);
        });
    }

    public async init() {
        this.config = await this.callHook<IDevtoolServerConfig>(DevtoolPluginHooks.beforeStart, this.getConfig());

        await this.startServer();

        this.transport.send(this.getWorkerID(), DevtoolWorkerMessages.START_SERVER, this.config);

        let caughtError = null;
        let pending = true;
        let handler = (error) => {
            caughtError = error;
            pending = false;
        };

        this.transport.once(DevtoolWorkerMessages.START_SERVER_COMPLETE, (error) => handler(error));

        await new Promise((resolve, reject) => {
            if (pending) {
                handler = (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                };
            } else if (caughtError) {
                reject(caughtError);
            } else {
                resolve();
            }
        });

        await this.initMessagesProxy();
        await this.callHook(DevtoolPluginHooks.afterStart);
    }

    public async kill() {
        await this.callHook(DevtoolPluginHooks.beforeStop);

        await this.stopServer();

        await this.callHook(DevtoolPluginHooks.afterStop);
    }
}
