import {
    IHttpRequest,
    IHttpResponse,
    IHttpServerController,
    ITransport,
    IHttpRequestMessage,
    IHttpResponseMessage,
    IHttpResponseRejectMessage,
    HttpMessageType,
    HttpServerPlugins,
} from '@testring-dev/types';
import {PluggableModule} from '@testring-dev/pluggable-module';
import {LoggerClient, loggerClient} from '@testring-dev/logger';

type MakeRequest = (request: IHttpRequest) => Promise<IHttpResponse>;

export class HttpServer
    extends PluggableModule
    implements IHttpServerController {
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

        const send = async (rData: IHttpRequestMessage, rSrc: string) => {
            let uid;
            const request = rData.request;

            try {
                uid = rData.uid;

                this.logger.verbose(`Sending http request to ${request.url}`);

                const requestAfterHook = await this.callHook(
                    HttpServerPlugins.beforeRequest,
                    request,
                    rData,
                );
                const response = await this.request(requestAfterHook);

                if (response.statusCode >= 400) {
                    throw new Error(response.statusMessage);
                }

                if (this.isKilled) {
                    return;
                }

                this.logger.verbose(`Successful response form ${request.url}`);

                const responseAfterHook = await this.callHook(
                    HttpServerPlugins.beforeResponse,
                    response,
                    rData,
                    requestAfterHook,
                );

                await this.sendResponse<IHttpResponseMessage>(
                    rSrc,
                    HttpMessageType.response,
                    {
                        uid,
                        response: responseAfterHook,
                    },
                );
            } catch (error) {
                if (this.isKilled) {
                    return;
                }

                const errorAfterHook = await this.callHook(
                    HttpServerPlugins.beforeError,
                    error,
                    rData,
                    request,
                );

                await this.sendResponse<IHttpResponseRejectMessage>(
                    rSrc,
                    HttpMessageType.reject,
                    {
                        uid,
                        error: errorAfterHook,
                    },
                );

                this.logger.debug(errorAfterHook);
            }
        };

        setImmediate(() =>
            send(data, src).catch((err) => this.logger.error(err)),
        );
    }

    private async sendResponse<T>(
        source: string | null,
        messageType: string,
        payload: T,
    ) {
        try {
            if (source) {
                await this.transportInstance.send<T>(
                    source,
                    messageType,
                    payload,
                );
            } else {
                this.transportInstance.broadcastLocal<T>(messageType, payload);
            }
        } catch (err) {
            this.logger.debug(err);
        }
    }
}
