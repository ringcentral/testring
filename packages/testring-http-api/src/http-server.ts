import * as request from 'request';
import * as requestPromise from 'request-promise';
import { PluggableModule } from '@testring/pluggable-module';
import { IConfig, ITransport } from '@testring/types';
import { loggerClientLocal } from '@testring/logger';
import { HttpMessageType, HttpServerPlugins } from './structs';
import { Request, Response, ResponseReject } from './interfaces';


interface QueueRequest {
    data: Request,
    src: string
}

type MakeRequest = (request: requestPromise.OptionsWithUrl) => any;

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
            loggerClientLocal.log(`Sending http request to ${request.url}`);

            this.isBusy = true;

            const requestAfterHook = await this.callHook(HttpServerPlugins.beforeRequest, request);
            const response: request.Response = await this.request(requestAfterHook);

            if (response.statusCode >= 400) {
                throw new Error(response.statusMessage);
            }

            loggerClientLocal.log('Successful responses');

            const responseAfterHook = await this.callHook(HttpServerPlugins.beforeResponse, response);

            this.send<Response>(src, HttpMessageType.response, {
                uid,
                response: responseAfterHook
            });
            this.setTimer();
        } catch (error) {
            this.send<ResponseReject>(src, HttpMessageType.reject, {
                uid,
                error
            });

            loggerClientLocal.error(error);
        }
    }

    private send<T>(source: string | null, messageType: string, payload: T) {
        if (source) {
            this.transportInstance.send<T>(source, messageType, payload);
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

        this.transportInstance.on(HttpMessageType.send, (data: Request, src: string) => {

            // todo validate data
            if (this.isBusy) {
                this.addToQueue(data, src);
            } else {
                this.makeRequest({ data, src });
            }
        });
    }
}
