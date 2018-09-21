import { IHttpRequest, IHttpResponse } from '@testring/types';
import { PluggableModule } from '@testring/pluggable-module';
import { LoggerClientLocal, loggerClientLocal } from '@testring/logger';
import {
    IConfig,
    ITransport,
    IHttpRequestMessage,
    IHttpResponseMessage,
    IHttpResponseRejectMessage,
    HttpMessageType,
    HttpServerPlugins
} from '@testring/types';

interface QueueRequest {
    data: IHttpRequestMessage;
    src: string;
}

type MakeRequest = (request: IHttpRequest) => Promise<IHttpResponse>;

export class HttpServer extends PluggableModule {
    private _logger: LoggerClientLocal | null = null;

    private queue: QueueRequest[] = [];

    private isBusy: boolean = false;

    private isKilled = false;

    constructor(
        private transportInstance: ITransport,
        private config: IConfig,
        private request: MakeRequest
    ) {
        super([
            HttpServerPlugins.beforeResponse,
            HttpServerPlugins.beforeRequest,
            HttpServerPlugins.beforeError,
        ]);
        this.registerTransportListener();
    }

    public kill() {
        this.isKilled = true;
    }

    private get logger(): LoggerClientLocal {
        if (this._logger) {
            return this._logger;
        }

        this._logger = loggerClientLocal.getLogger('[http-server]');

        return this._logger;
    }


    private addToQueue(data: IHttpRequestMessage, src: string): void {
        this.queue.push({
            data,
            src
        });
    }

    private async makeRequest(data, src): Promise<void> {
        if (this.isKilled) {
            return;
        }

        let uid;

        try {
            uid = data.uid;
            const request = data.request;
            this.logger.verbose(`Sending http request to ${request.url}`);

            this.isBusy = true;

            const requestAfterHook = await this.callHook(HttpServerPlugins.beforeRequest, request, data);
            const response = await this.request(requestAfterHook);

            if (response.statusCode >= 400) {
                throw new Error(response.statusMessage);
            }

            if (this.isKilled) {
                return;
            }

            this.logger.verbose(`Successful response form ${request.url}`);

            const responseAfterHook = await this.callHook(HttpServerPlugins.beforeResponse, response, data);

            await this.send<IHttpResponseMessage>(src, HttpMessageType.response, {
                uid,
                response: responseAfterHook
            });

            this.setTimer();
        } catch (error) {
            if (this.isKilled) {
                return;
            }

            const errorAfterHook = await this.callHook(HttpServerPlugins.beforeError, error, data);

            await this.send<IHttpResponseRejectMessage>(src, HttpMessageType.reject, {
                uid,
                error: errorAfterHook
            });

            this.logger.debug(errorAfterHook);
            this.setTimer();
        }
    }

    private async send<T>(source: string | null, messageType: string, payload: T) {
        try {
            if (source) {
                await this.transportInstance.send<T>(source, messageType, payload);
            } else {
                this.transportInstance.broadcastLocal<T>(messageType, payload);
            }
        } catch (err) {
            this.logger.debug(err);
        }
    }

    private setTimer(): void {
        setTimeout(() => {
            if (this.queue.length) {
                const request = this.queue.shift();

                if (request) {
                    const { data, src } = request;
                    this.makeRequest(data, src);
                }
            } else {
                this.isBusy = false;
            }
        }, this.config.httpThrottle);
    }

    private registerTransportListener(): void {
        this.logger.debug(`Http server: Register listener for messages [type = ${HttpMessageType.send}]`);

        this.transportInstance.on(HttpMessageType.send, (data: IHttpRequestMessage, src: string) => {
            if (this.isKilled) {
                return;
            }

            // todo validate data
            if (this.isBusy) {
                this.addToQueue(data, src);
            } else {
                this.makeRequest(data, src);
            }
        });
    }
}
