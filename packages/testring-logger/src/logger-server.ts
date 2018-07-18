import { PluggableModule } from '@testring/pluggable-module';
import { Queue } from '@testring/utils';
import {
    IConfig,
    ITransport,
    ILogEntry,
    ILoggerServer,
    LoggerMessageTypes,
    LogQueueStatus,
    LoggerPlugins
} from '@testring/types';

export enum LogLevelNumeric {
    verbose,
    debug,
    info,
    warning,
    error,
    silent
}

export class LoggerServer extends PluggableModule implements ILoggerServer {

    private queue: Queue<ILogEntry> = new Queue();

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
        this.transportInstance.on(LoggerMessageTypes.REPORT, (entry: ILogEntry) => {
            this.log(entry);
        });

        this.transportInstance.on(LoggerMessageTypes.REPORT_BATCH, (batch: Array<ILogEntry>) => {
            batch.forEach((entry) => this.log(entry));
        });
    }

    private async runQueue(retry: number = this.numberOfRetries): Promise<void> {
        const logEntity = this.queue.shift();

        if (logEntity === undefined) {
            this.status = LogQueueStatus.EMPTY;
            return;
        }

        this.status = LogQueueStatus.RUNNING;

        try {
            const entryAfterPlugin = await this.callHook(LoggerPlugins.beforeLog, logEntity);

            await this.callHook(LoggerPlugins.onLog, entryAfterPlugin);

            this.runQueue();
        } catch (error) {
            await this.callHook(LoggerPlugins.onError, error);

            if (retry > 0) {
                this.queue.push(logEntity);
                this.runQueue(retry - 1);
            } else if (this.shouldSkip) {
                this.runQueue();
            } else {
                throw error;
            }
        }
    }

    private log(entry: ILogEntry): void {
        // fast checking aliases
        if (this.config.silent) {
            return;
        }

        // filtering by log level
        if (LogLevelNumeric[entry.logLevel] < LogLevelNumeric[this.config.logLevel]) {
            return;
        }

        const shouldRun = this.queue.length === 0;

        this.stdout.write(`${entry.formattedMessage}\n`);
        this.queue.push(entry);

        if (shouldRun) {
            this.runQueue();
        }
    }

    public getQueueStatus(): LogQueueStatus {
        return this.status;
    }
}
