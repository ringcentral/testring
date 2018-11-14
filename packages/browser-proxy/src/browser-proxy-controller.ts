import { ChildProcess } from 'child_process';

import {
    BrowserProxyActions,
    BrowserProxyPlugins,
    IBrowserProxyCommand,
    IBrowserProxyController,
    IBrowserProxyWorker,
    ITransport
} from '@testring/types';
import { PluggableModule } from '@testring/pluggable-module';
import { loggerClientLocal } from '@testring/logger';

import { BrowserProxyWorker } from './browser-proxy-worker';


type BrowserProxyWorkerConfig = {
    plugin: string;
    config: any;
};


const logger = loggerClientLocal.withPrefix('[browser-proxy-controller]');


export class BrowserProxyController extends PluggableModule implements IBrowserProxyController {
    private workersPool: Set<IBrowserProxyWorker> = new Set();

    private applicantWorkerMap: Map<string, IBrowserProxyWorker> = new Map();

    private defaultExternalPlugin: BrowserProxyWorkerConfig = {
        plugin: 'unknown',
        config: null,
    };

    private externalPlugin: BrowserProxyWorkerConfig;

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
        const worker = this.getWorker(applicant);

        if (command.action === BrowserProxyActions.end) {
            this.applicantWorkerMap.delete(applicant);
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

        await Promise.all(workersToKill);

        this.reset();
    }
}
