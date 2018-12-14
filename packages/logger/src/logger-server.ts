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
    LoggerPlugins,
} from '@testring/types';
import { formatLog } from './format-log';

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
            LoggerPlugins.onError,
        ]);

        this.registerTransportListeners();
    }

    private registerTransportListeners(): void {
        this.transportInstance.on(LoggerMessageTypes.REPORT, (entry: ILogEntity, processID?: string) => {
            this.log(entry, processID);
        });
    }

    private async runQueue(retry: number = this.numberOfRetries): Promise<void> {
        const queueItem = this.queue.shift();

        if (queueItem === undefined) {
            this.status = LogQueueStatus.EMPTY;
            return;
        }

        const { logEntity, meta } = queueItem;

        this.status = LogQueueStatus.RUNNING;

        try {
            const entryAfterPlugin = await this.callHook(LoggerPlugins.beforeLog, logEntity, meta);

            await this.callHook(LoggerPlugins.onLog, entryAfterPlugin, meta);

            this.runQueue();
        } catch (error) {
            await this.callHook(LoggerPlugins.onError, error, meta);

            if (retry > 0) {
                this.queue.push({ logEntity, meta });
                this.runQueue(retry - 1);
            } else if (this.shouldSkip) {
                this.runQueue();
            } else {
                throw error;
            }
        }
    }

    private log(logEntity: ILogEntity, processID?: string): void {
        // fast checking aliases
        if (this.config.silent) {
            return;
        }

        // filtering by log level
        if (LogLevelNumeric[logEntity.logLevel] < LogLevelNumeric[this.config.logLevel]) {
            return;
        }

        const shouldRun = this.queue.length === 0;
        const formattedMessage = formatLog(logEntity, processID);
        const meta = processID ? { processID } : {};

        this.stdout.write(`${formattedMessage}\n`);
        this.queue.push({
            logEntity,
            meta,
        });

        if (shouldRun) {
            this.runQueue();
        }
    }

    public getQueueStatus(): LogQueueStatus {
        return this.status;
    }
}
