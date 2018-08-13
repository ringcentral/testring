import { PluggableModule } from '@testring/pluggable-module';
import { Queue } from '@testring/utils';
import {
    IConfig,
    ITransport,
    ILogEntity,
    ILogQueue,
    ILoggerServer,
    LoggerMessageTypes,
    LogQueueStatus,
    LoggerPlugins
} from '@testring/types';
import { formatLog } from './log-formatter';

export enum LogLevelNumeric {
    verbose,
    debug,
    info,
    warning,
    error,
    silent
}

export class LoggerServer extends PluggableModule implements ILoggerServer {

    private queue: Queue<ILogQueue> = new Queue();

    private status: LogQueueStatus = LogQueueStatus.EMPTY;

    constructor(
        private config: IConfig,
        private transportInstance: ITransport,
        private stdout: NodeJS.WritableStream,
        private numberOfRetries: number = 0,
        private shouldSkip: boolean = false
    ) {
        super([
            LoggerPlugins.beforeLog,
            LoggerPlugins.onLog,
            LoggerPlugins.onError
        ]);

        this.registerTransportListeners();
    }

    private registerTransportListeners(): void {
        this.transportInstance.on(LoggerMessageTypes.REPORT, (entry: ILogEntity, processId?: string) => {
            this.log(entry, processId);
        });

        this.transportInstance.on(LoggerMessageTypes.REPORT_BATCH, (batch: Array<ILogEntity>, processId?: string) => {
            batch.forEach((entry) => this.log(entry, processId));
        });
    }

    private async runQueue(retry: number = this.numberOfRetries): Promise<void> {
        const queueItem = this.queue.shift();

        if (queueItem === undefined) {
            this.status = LogQueueStatus.EMPTY;
            return;
        }

        const {logEntity, processId} = queueItem;

        this.status = LogQueueStatus.RUNNING;

        try {
            const entryAfterPlugin = await this.callHook(LoggerPlugins.beforeLog, logEntity, processId);

            await this.callHook(LoggerPlugins.onLog, entryAfterPlugin, processId);

            this.runQueue();
        } catch (error) {
            await this.callHook(LoggerPlugins.onError, error, processId);

            if (retry > 0) {
                this.queue.push({logEntity, processId});
                this.runQueue(retry - 1);
            } else if (this.shouldSkip) {
                this.runQueue();
            } else {
                throw error;
            }
        }
    }

    private log(entry: ILogEntity, processId?: string): void {
        // fast checking aliases
        if (this.config.silent) {
            return;
        }

        // filtering by log level
        if (LogLevelNumeric[entry.logLevel] < LogLevelNumeric[this.config.logLevel]) {
            return;
        }

        const shouldRun = this.queue.length === 0;
        const formattedMessage = formatLog(entry);

        this.stdout.write(`${formattedMessage}\n`);
        this.queue.push({
            logEntity: entry,
            processId,
        });

        if (shouldRun) {
            this.runQueue();
        }
    }

    public getQueueStatus(): LogQueueStatus {
        return this.status;
    }
}
