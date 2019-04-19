import {
    IRecorderRuntimeConfiguration,
    IRecorderServerConfig,
    IRecorderServerController,
    RecorderPlugins,
    IChildProcessFork,
    ITransport,
    RecorderWorkerMessages,
    WebApplicationDevtoolMessageType,
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
        const toServerHandler = (messageData, processID?: string) => {
            this.transport.send(this.getWorkerID(), messageType, {
                messageData,
                fromWorker: processID,
            });
        };
        this.transport.on(messageType, toServerHandler);
    }

    private addFromServerProxyHandler(messageType) {
        const fromServerHandler = (payload) => {
            if (payload.fromWorker !== null && payload.fromWorker !== undefined) {
                this.transport.send(payload.fromWorker, messageType, payload.messageData);
            } else {
                this.transport.broadcast(messageType, payload.messageData);
            }
        };
        this.transport.on(messageType, fromServerHandler);
    }

    private initMessagesProxy() {
        [
            WebApplicationDevtoolMessageType.register,
            WebApplicationDevtoolMessageType.unregister,
        ].forEach((event) => this.addToServerProxyHandler(event));


        [
            WebApplicationDevtoolMessageType.registerComplete,
            WebApplicationDevtoolMessageType.unregisterComplete,
        ].forEach((event) => this.addFromServerProxyHandler(event));
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
