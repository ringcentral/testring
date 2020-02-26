import { IHttpRequest, IHttpResponse, IHttpServerController } from '@testring/types';
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

export class HttpServer extends PluggableModule implements IHttpServerController {
    private unsubscribeTransport: Function;

    private logger: LoggerClient = loggerClient.withPrefix('[http-server]');

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

    private makeRequest(data: IHttpRequestMessage, src: string): void {
        if (this.isKilled) {
            return;
        }

        const send = async (data: IHttpRequestMessage, src: string) => {
            let uid;
            const request = data.request;

            try {
                uid = data.uid;

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

                const responseAfterHook = await this.callHook(HttpServerPlugins.beforeResponse, response,
                    data, requestAfterHook);

                await this.sendResponse<IHttpResponseMessage>(src, HttpMessageType.response, {
                    uid,
                    response: responseAfterHook,
                });
            } catch (error) {
                if (this.isKilled) {
                    return;
                }

                const errorAfterHook = await this.callHook(HttpServerPlugins.beforeError, error, data, request);

                await this.sendResponse<IHttpResponseRejectMessage>(src, HttpMessageType.reject, {
                    uid,
                    error: errorAfterHook,
                });

                this.logger.debug(errorAfterHook);
            }
        };

        setImmediate(() => send(data, src).catch(err => this.logger.error(err)));
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
