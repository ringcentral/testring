import { IHttpRequest, IHttpResponse } from '@testring/types';
import { PluggableModule } from '@testring/pluggable-module';
import { loggerClientLocal } from '@testring/logger';
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
    private queue: QueueRequest[] = [];
    private isBusy: boolean = false;

    constructor(
        private transportInstance: ITransport,
        private config: IConfig,
        private request: MakeRequest
    ) {
        super([
            HttpServerPlugins.beforeResponse,
            HttpServerPlugins.beforeRequest
        ]);
        this.registerTransportListener();
    }


    private addToQueue(data, src): void {
        this.queue.push({
            data,
            src
        });
    }

    private async makeRequest({ data, src }: QueueRequest): Promise<any> {
        let uid;
        try {
            uid = data.uid;
            const request = data.request;
            loggerClientLocal.verbose(`[http server] Sending http request to ${request.url}`);

            this.isBusy = true;

            const requestAfterHook = await this.callHook(HttpServerPlugins.beforeRequest, request);
            const response = await this.request(requestAfterHook);

            if (response.statusCode >= 400) {
                throw new Error(response.statusMessage);
            }

            loggerClientLocal.verbose('[http server] Successful response');

            const responseAfterHook = await this.callHook(HttpServerPlugins.beforeResponse, response);

            this.send<IHttpResponseMessage>(src, HttpMessageType.response, {
                uid,
                response: responseAfterHook
            });
            this.setTimer();
        } catch (error) {
            this.send<IHttpResponseRejectMessage>(src, HttpMessageType.reject, {
                uid,
                error
            });

            loggerClientLocal.error(error);
        }
    }

    private send<T>(source: string | null, messageType: string, payload: T) {
        if (source) {
            this.transportInstance.send<T>(source, messageType, payload)
                .catch((error) => loggerClientLocal.error(error));
        } else {
            this.transportInstance.broadcastLocal<T>(messageType, payload);
        }
    }

    private setTimer(): void {
        setTimeout(() => {
            if (this.queue.length) {
                const request = this.queue.shift();

                if (request) {
                    this.makeRequest(request);
                }
            } else {
                this.isBusy = false;
            }
        }, this.config.httpThrottle);
    }

    private registerTransportListener(): void {
        loggerClientLocal.debug(`Http server: Register listener for messages [type = ${HttpMessageType.send}]`);

        this.transportInstance.on(HttpMessageType.send, (data: IHttpRequestMessage, src: string) => {

            // todo validate data
            if (this.isBusy) {
                this.addToQueue(data, src);
            } else {
                this.makeRequest({ data, src });
            }
        });
    }
}
