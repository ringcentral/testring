import {
    IRecorderRuntimeConfiguration,
    IRecorderServerConfig,
    IRecorderServerController,
    RecorderPlugins,
    IChildProcessFork,
    ITransport,
    RecorderWorkerMessages,
    WebApplicationDevtoolMessageType,
    IRecorderProxyMessage,
    RecorderProxyMessages,
} from '@testring/types';

import * as path from 'path';

import { fork } from '@testring/child-process';
import { generateUniqId } from '@testring/utils';
import { PluggableModule } from '@testring/pluggable-module';
import { loggerClient } from '@testring/logger';
import { defaultRecorderConfig } from './default-recorder-config';

import { extensionId } from '@testring/recorder-extension';


export class RecorderServerController extends PluggableModule implements IRecorderServerController {

    private workerID: string;

    private worker: IChildProcessFork;

    private logger = loggerClient.withPrefix('[recorder-server]');

    private config: IRecorderServerConfig;

    constructor(private transport: ITransport) {
        super([
            RecorderPlugins.beforeStart,
            RecorderPlugins.afterStart,
            RecorderPlugins.beforeStop,
            RecorderPlugins.afterStop,
        ]);
    }

    private getConfig(): IRecorderServerConfig {
        return defaultRecorderConfig;
    }

    public getRuntimeConfiguration(): IRecorderRuntimeConfiguration {
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

        this.worker.stdout.on('data', (data) => {
            this.logger.log(`[logged] ${data.toString().trim()}`);
        });

        this.worker.stderr.on('data', (data) => {
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
            this.transport.send<IRecorderProxyMessage>(this.getWorkerID(), RecorderProxyMessages.TO_WORKER, {
                fromWorker: processID,
                messageType,
                messageData,
            });
        };
        this.transport.on(messageType, toServerHandler);
    }

    private handleProxiedMessage(message: IRecorderProxyMessage) {
        if (message.fromWorker) {
            this.transport.send(message.fromWorker as string, message.messageType, message.messageData);
        } else {
            this.transport.broadcastLocal(message.messageType, message.messageData);
        }
    }

    private initMessagesProxy() {
        [
            WebApplicationDevtoolMessageType.register,
            WebApplicationDevtoolMessageType.unregister,
        ].forEach((event) => this.addToServerProxyHandler(event));

        this.transport.on<IRecorderProxyMessage>(RecorderProxyMessages.FROM_WORKER, (payload) => {
            this.handleProxiedMessage(payload);
        });
    }

    public async init() {
        this.config = await this.callHook<IRecorderServerConfig>(RecorderPlugins.beforeStart, this.getConfig());

        await this.startServer();

        this.transport.send(this.getWorkerID(), RecorderWorkerMessages.START_SERVER, this.config);

        let caughtError = null;
        let pending = true;
        let handler = (error) => {
            caughtError = error;
            pending = false;
        };

        this.transport.once(RecorderWorkerMessages.START_SERVER_COMPLETE, (error) => handler(error));

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
        await this.callHook(RecorderPlugins.afterStart);
    }

    public async kill() {
        await this.callHook(RecorderPlugins.beforeStop);

        await this.stopServer();

        await this.callHook(RecorderPlugins.afterStop);
    }
}
