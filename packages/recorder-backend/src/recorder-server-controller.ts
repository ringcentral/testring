import {
    IRecorderServerConfig,
    IRecorderServerController,
    RecorderPlugins,
    IChildProcessFork,
    ITransport,
} from '@testring/types';

import * as path from 'path';

import { fork } from '@testring/child-process';
import { generateUniqId } from '@testring/utils';
import { PluggableModule } from '@testring/pluggable-module';
import { loggerClient } from '@testring/logger';

export class RecorderServerController extends PluggableModule implements IRecorderServerController {

    private workerID: string;

    private worker: IChildProcessFork;

    private logger = loggerClient.withPrefix('[recorder-server]');

    constructor(private transport: ITransport) {
        super([
            RecorderPlugins.beforeStart,
            RecorderPlugins.afterStart,
            RecorderPlugins.beforeStop,
            RecorderPlugins.afterStop,
        ]);
    }

    private getConfig(): IRecorderServerConfig {
        return {
            host: 'localhost',
            wsPort: 4444,
            httpPort: 5555,
            router: [],
            handlers: [],
            middlewares: [],
        };
    }

    private getWorkerID(): string {
        if (!this.workerID) {
            this.workerID = generateUniqId();
        }
        return this.workerID;
    }

    private async startServer(config: IRecorderServerConfig) {
        const workerPath = path.resolve(__dirname, 'worker');
        const workerID = this.getWorkerID();

        this.worker = await fork(workerPath, [], { debug: false });

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

    public async init() {
        const config = await this.callHook<IRecorderServerConfig>(RecorderPlugins.beforeStart, this.getConfig());

        await this.startServer(config);

        await this.callHook(RecorderPlugins.afterStart);
    }

    public async kill() {
        await this.callHook(RecorderPlugins.beforeStop);

        await this.stopServer();

        await this.callHook(RecorderPlugins.afterStop);
    }
}
