import {ChildProcess} from 'child_process';
import {
    BrowserProxyActions,
    BrowserProxyPlugins,
    IBrowserProxyCommand,
    IBrowserProxyController,
    IBrowserProxyWorker,
    IBrowserProxyWorkerConfig,
    ITransport,
} from '@testring/types';
import {PluggableModule} from '@testring/pluggable-module';
import {loggerClient} from '@testring/logger';
import {BrowserProxyWorker} from './browser-proxy-worker';
import {BrowserProxyLocalWorker} from './browser-proxy-local-worker';

const logger = loggerClient.withPrefix('[browser-proxy-controller]');

export class BrowserProxyController
    extends PluggableModule
    implements IBrowserProxyController
{
    private workersPool: Set<IBrowserProxyWorker> = new Set();
    private applicantWorkerMap: Map<string, IBrowserProxyWorker> = new Map();
    private defaultExternalPlugin: IBrowserProxyWorkerConfig = {
        plugin: 'unknown',
        config: null,
    };
    private externalPlugin: IBrowserProxyWorkerConfig = this.defaultExternalPlugin;
    private lastWorkerIndex = -1;
    private workerLimit: number | 'local' = 1;
    private logger = logger;
    private localWorker: BrowserProxyLocalWorker | null = null;

    constructor(
        private transport: ITransport,
        private workerCreator: (
            pluginPath: string,
            config: any,
        ) => ChildProcess | Promise<ChildProcess>,
    ) {
        super([BrowserProxyPlugins.getPlugin]);
    }

    public async init(): Promise<void> {
        if (typeof this.workerCreator !== 'function') {
            this.logger.error(
                `Unsupported worker type "${typeof this.workerCreator}"`,
            );
            throw new Error(
                `Unsupported worker type "${typeof this.workerCreator}"`,
            );
        }

        this.externalPlugin = await this.callHook(
            BrowserProxyPlugins.getPlugin,
            this.defaultExternalPlugin,
        );
        const {config} = this.externalPlugin;

        if (config && config.workerLimit) {
            this.workerLimit =
                config.workerLimit === 'local'
                    ? 'local'
                    : Number(config.workerLimit);
        }

        if (this.workerLimit === 'local') {
            this.localWorker = new BrowserProxyLocalWorker(
                this.transport,
                this.externalPlugin,
            );
        }
    }

    private getWorker(applicant: string): IBrowserProxyWorker {
        if (this.workerLimit === 'local' && this.localWorker) {
            return this.localWorker;
        }

        const mappedWorker = this.applicantWorkerMap.get(applicant);
        let worker: IBrowserProxyWorker | undefined;

        if (mappedWorker) {
            return mappedWorker;
        }

        if (this.workersPool.size < (this.workerLimit as number)) {
            worker = new BrowserProxyWorker(
                this.transport,
                this.workerCreator,
                this.externalPlugin,
            );
            this.workersPool.add(worker);
            this.lastWorkerIndex = this.workersPool.size - 1;
        } else {
            this.lastWorkerIndex =
                this.lastWorkerIndex + 1 < this.workersPool.size
                    ? this.lastWorkerIndex + 1
                    : 0;
            worker = [...this.workersPool.values()][this.lastWorkerIndex];
        }

        if (!worker) {
            throw new Error('Failed to get or create a worker');
        }
        this.applicantWorkerMap.set(applicant, worker);
        return worker;
    }

    public async execute(
        applicant: string,
        command: IBrowserProxyCommand,
    ): Promise<any> {
        if (command.action === BrowserProxyActions.end) {
            if (this.localWorker) {
                return this.localWorker.execute(applicant, command);
            }

            if (this.applicantWorkerMap.has(applicant)) {
                const worker = this.getWorker(applicant);
                this.applicantWorkerMap.delete(applicant);
                return worker.execute(applicant, command);
            }
            return true;
        }

        const worker = this.getWorker(applicant);
        return worker.execute(applicant, command);
    }

    public async kill(): Promise<void> {
        if (this.workerLimit === 'local' && this.localWorker) {
            await this.localWorker.kill();
            this.localWorker = null;
            return;
        }

        const workersToKill = [...this.workersPool.values()].map((worker) =>
            worker.kill(),
        );

        try {
            await Promise.all(workersToKill);
        } catch (err) {
            logger.error('Exit failed ', err);
        }

        this.workersPool.clear();
        this.applicantWorkerMap.clear();
        this.externalPlugin = this.defaultExternalPlugin;
        this.lastWorkerIndex = -1;
        this.workerLimit = 1;
    }
}
