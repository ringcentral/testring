import { WriteStream } from 'tty';
import { IConfig } from '@testring/typings';
import { Transport } from '@testring/transport';
import { PluggableModule } from '@testring/pluggable-module';
import { ILogEntry } from '../interfaces';
import { LoggerMessageTypes, LogQueueStatus } from './structs';

export enum LoggerPlugins {
    beforeLog = 'beforeLog',
    onLog = 'onLog',
    onError = 'onError',
}

export class LoggerServer extends PluggableModule {

    constructor(
        private config: IConfig,
        private transportInstance: Transport,
        private stdout: WriteStream,
        private numberOfRetries: number = 0,
        private shouldSkip: boolean = false,
    ) {
        super([
            LoggerPlugins.beforeLog,
            LoggerPlugins.onLog,
            LoggerPlugins.onError,
        ]);

        this.registerTransportListeners();
    }

    private queue: ILogEntry[] = [];

    private status: LogQueueStatus = LogQueueStatus.EMPTY;

    private registerTransportListeners(): void {
        this.transportInstance.on(LoggerMessageTypes.REPORT, (entry: ILogEntry) => this.log(entry));
    }

    private async runQueue(retry: number = this.numberOfRetries): Promise<void> {
        const entry = this.queue[0];

        if (entry) {
            this.status = LogQueueStatus.RUNNING;

            const entryAfterPlugin = await this.callHook(LoggerPlugins.beforeLog, entry);

            try {
                await this.callHook(LoggerPlugins.onLog, entryAfterPlugin);

                this.queue.shift();
                this.runQueue();
            } catch (e) {
                await this.callHook(LoggerPlugins.onError, e);

                if (retry > 0) {
                    this.runQueue(retry - 1);
                } else if (this.shouldSkip) {
                    this.queue.shift();
                    this.runQueue();
                } else {
                    throw e;
                }
            }
        } else {
            this.status = LogQueueStatus.EMPTY;
        }
    }

    private log(entry: ILogEntry): void {
        if (this.config.silent) {
            return;
        }
        if (entry.logLevel < this.config.loggerLevel) {
            return;
        }

        this.stdout.write(entry.formattedMessage + '\n');

        const shouldRun = this.queue.length === 0;

        this.queue.push(entry);

        if (shouldRun) {
            setImmediate(() => {
                this.runQueue();
            });
        }
    }

    public getQueueStatus(): LogQueueStatus {
        return this.status;
    }
}
