import { IHttpRequest, IHttpResponse } from '@testring/types';
import { PluggableModule } from '@testring/pluggable-module';
import { LoggerClient, loggerClient } from '@testring/logger';
import {
    ITransport,
    IHttpRequestMessage,
    IHttpResponseMessage,
    IHttpResponseRejectMessage,
    HttpMessageType,
    HttpServerPlugins,
} from '@testring/types';

type MakeRequest = (request: IHttpRequest) => Promise<IHttpResponse>;

export class HttpServer extends PluggableModule {
    private unsubscribeTransport: Function;

    private loggerInstance: LoggerClient | null = null;

    private isKilled = false;

    constructor(
        private transportInstance: ITransport,
        private request: MakeRequest,
    ) {
        super([
            HttpServerPlugins.beforeResponse,
            HttpServerPlugins.beforeRequest,
            HttpServerPlugins.beforeError,
        ]);

        this.unsubscribeTransport = this.transportInstance.on(
            HttpMessageType.send,
            (data: IHttpRequestMessage, src: string) => {
                if (this.isKilled) {
                    return;
                }

                this.makeRequest(data, src);
            },
        );
    }

    public kill() {
        this.isKilled = true;
        this.unsubscribeTransport();
    }

    private get logger(): LoggerClient {
        if (this.loggerInstance) {
            return this.loggerInstance;
        }

        this.loggerInstance = loggerClient.withPrefix('[http-server]');

        return this.loggerInstance;
    }

    private makeRequest(data: IHttpRequestMessage, src: string): void {
        if (this.isKilled) {
            return;
        }

        setImmediate(async () => {
            let uid;

            try {
                uid = data.uid;

                const request = data.request;

                this.logger.verbose(`Sending http request to ${request.url}`);

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

                await this.sendResponse<IHttpResponseMessage>(src, HttpMessageType.response, {
                    uid,
                    response: responseAfterHook,
                });
            } catch (error) {
                if (this.isKilled) {
                    return;
                }

                const errorAfterHook = await this.callHook(HttpServerPlugins.beforeError, error, data);

                await this.sendResponse<IHttpResponseRejectMessage>(src, HttpMessageType.reject, {
                    uid,
                    error: errorAfterHook,
                });

                this.logger.debug(errorAfterHook);
            }
        });
    }

    private async sendResponse<T>(source: string | null, messageType: string, payload: T) {
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
}
