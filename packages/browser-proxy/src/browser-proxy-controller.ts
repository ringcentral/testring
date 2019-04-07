import { ChildProcess } from 'child_process';

import {
    BrowserProxyActions,
    BrowserProxyPlugins,
    IBrowserProxyCommand,
    IBrowserProxyController,
    IBrowserProxyWorker,
    IBrowserProxyWorkerConfig,
    ITransport,
} from '@testring/types';
import { PluggableModule } from '@testring/pluggable-module';
import { loggerClient } from '@testring/logger';

import { BrowserProxyWorker } from './browser-proxy-worker';


const logger = loggerClient.withPrefix('[browser-proxy-controller]');


export class BrowserProxyController extends PluggableModule implements IBrowserProxyController {
    private workersPool: Set<IBrowserProxyWorker> = new Set();

    private applicantWorkerMap: Map<string, IBrowserProxyWorker> = new Map();

    private defaultExternalPlugin: IBrowserProxyWorkerConfig = {
        plugin: 'unknown',
        config: null,
    };

    private externalPlugin: IBrowserProxyWorkerConfig;

    private lastWorkerIndex: number;

    private workerLimit: number = 1;

    private logger = logger;

    constructor(
        private transport: ITransport,
        private workerCreator: (onActionPluginPath: string, config: any) => ChildProcess | Promise<ChildProcess>,
    ) {
        super([ BrowserProxyPlugins.getPlugin ]);
    }

    public async init(): Promise<void> {
        if (typeof this.workerCreator !== 'function') {
            this.logger.error(`Unsupported worker type "${typeof this.workerCreator}"`);
            throw new Error(`Unsupported worker type "${typeof this.workerCreator}"`);
        }

        this.externalPlugin = await this.callHook(BrowserProxyPlugins.getPlugin, this.defaultExternalPlugin);

        const { config } = this.externalPlugin;

        if (config && typeof config.workerLimit === 'number' && !isNaN(config.workerLimit)) {
            this.workerLimit = config.workerLimit;
        }
    }

    private getWorker(applicant: string): IBrowserProxyWorker {
        let mappedWorker = this.applicantWorkerMap.get(applicant);
        let worker;

        if (mappedWorker) {
            return mappedWorker;
        }

        if (this.workersPool.size < this.workerLimit) {
            worker = new BrowserProxyWorker(this.transport, this.workerCreator, this.externalPlugin);
            this.workersPool.add(worker);
            this.lastWorkerIndex = this.workersPool.size - 1;
        } else {
            this.lastWorkerIndex = (this.lastWorkerIndex + 1 < this.workersPool.size) ? this.lastWorkerIndex + 1 : 0;
            worker = [...this.workersPool.values()][this.lastWorkerIndex];
        }

        this.applicantWorkerMap.set(applicant, worker);

        return worker;
    }

    public async execute(applicant: string, command: IBrowserProxyCommand): Promise<any> {
        let worker;

        if (command.action === BrowserProxyActions.end) {
            if (this.applicantWorkerMap.has(applicant)) {
                worker = this.getWorker(applicant);
            } else {
                return true;
            }

            this.applicantWorkerMap.delete(applicant);
        } else {
            worker = this.getWorker(applicant);
        }

        return worker.execute(applicant, command);
    }

    private reset() {
        this.workersPool.clear();

        this.applicantWorkerMap.clear();

        delete this.externalPlugin;

        delete this.lastWorkerIndex;

        this.workerLimit = 1;
    }

    public async kill(): Promise<void> {
        const workersToKill = [...this.workersPool.values()].map(worker => worker.kill());

        try {
            await Promise.all(workersToKill);
        } catch (err) {
            logger.error('Exit failed ', err);
        }

        this.reset();
    }
}
