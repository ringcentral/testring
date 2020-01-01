import {
    HttpMessageType,
    ITransport,
    IHttpClient,
    IHttpCookieJar,
    IHttpRequest,
    IHttpResponseMessage,
    IHttpRequestMessage,
    IHttpResponseRejectMessage,
    IQueue,
    HttpClientParams,
} from '@testring/types';
import { LoggerClient, loggerClient } from '@testring/logger';
import { Queue, generateUniqId } from '@testring/utils';
import { HttpCookieJar } from './cookie-jar';

const toString = c => c.toString();

export abstract class AbstractHttpClient implements IHttpClient {
    protected abstract broadcast(options: IHttpRequestMessage): void;

    protected loggerClient: LoggerClient = loggerClient.withPrefix('[http client]');

    private requestQueue: IQueue<Function>;

    private params: HttpClientParams = {
        httpThrottle: 0,
    };

    private queueRunning = false;

    constructor(protected transportInstance: ITransport, params: Partial<HttpClientParams> = {}) {
        this.requestQueue = new Queue();

        this.params = Object.assign<HttpClientParams, Partial<HttpClientParams>>(this.params, params);
    }

    public post(options: IHttpRequest, cookieJar?: IHttpCookieJar): Promise<any> {
        return this.pushToQueue({ ...options, method: 'POST' }, cookieJar);
    }

    public get(options: IHttpRequest, cookieJar?: IHttpCookieJar): Promise<any> {
        return this.pushToQueue({ ...options, method: 'GET' }, cookieJar);
    }

    public delete(options: IHttpRequest, cookieJar?: IHttpCookieJar): Promise<any> {
        return this.pushToQueue({ ...options, method: 'DELETE' }, cookieJar);
    }

    public put(options: IHttpRequest, cookieJar?: IHttpCookieJar): Promise<any> {
        return this.pushToQueue({ ...options, method: 'PUT' }, cookieJar);
    }

    public send(options: IHttpRequest, cookieJar?: IHttpCookieJar): Promise<any> {
        return this.pushToQueue({ ...options }, cookieJar);
    }

    public createCookieJar() {
        return new HttpCookieJar();
    }

    private isValidData(data: any): boolean {
        return (data !== null && data !== undefined);
    }

    private isValidRequest(request: IHttpRequest): boolean {
        return (this.isValidData(request) && Object.prototype.hasOwnProperty.call(request,'url'));
    }

    private async throttleDelay() {
        await new Promise(resolve => setTimeout(resolve, this.params.httpThrottle));
    }

    private async runQueue(): Promise<void> {
        if (this.queueRunning) {
            return;
        }

        this.queueRunning = true;

        while (this.requestQueue.length) {
            const item = this.requestQueue.shift();

            if (item) {
                await item();
                await this.throttleDelay();
            }
        }

        this.queueRunning = false;
    }

    private pushToQueue(requestParameters: IHttpRequest, cookieJar?: IHttpCookieJar): Promise<any> {
        return new Promise((resolve, reject) => {
            const sendRequest = () => this.sendRequest(requestParameters, cookieJar).then(resolve, reject);

            this.requestQueue.push(sendRequest);
            // TODO (flops) move throttling into HttpServer
            this.runQueue();
        });
    }

    // TODO (flops) refactor this function
    // eslint-disable-next-line sonarjs/cognitive-complexity
    private async sendRequest(requestParameters: IHttpRequest, cookieJar?: IHttpCookieJar): Promise<any> {
        if (cookieJar) {
            requestParameters = {
                ...requestParameters,
                cookies: cookieJar.getCookies(requestParameters.url).map(toString),
            };
        }

        if (!this.isValidRequest(requestParameters)) {
            this.loggerClient.error(`${requestParameters} request is not valid`);

            throw new Error('request is not valid');
        }

        const requestUID = generateUniqId();

        return new Promise((resolve, reject) => {
            const removeResponseHandler = this.transportInstance.on(
                HttpMessageType.response,
                (response: IHttpResponseMessage) => {
                    if (!response.uid) {
                        this.loggerClient.error('no response uid');
                        throw new Error('no uid');
                    }

                    if (response.uid === requestUID) {
                        removeResponseHandler();
                        // eslint-disable-next-line no-use-before-define
                        removeRejectHandler();

                        if (cookieJar) {
                            cookieJar.setCookies(response.response.cookies, requestParameters.url);
                        }

                        if (requestParameters.resolveWithFullResponse) {
                            resolve(response.response);
                        } else {
                            resolve(response.response.body);
                        }
                    }
                },
            );

            const removeRejectHandler = this.transportInstance.on(
                HttpMessageType.reject,
                (response: IHttpResponseRejectMessage) => {
                    if (!response.uid) {
                        this.loggerClient.error('no response uid');
                        throw new Error('no uid');
                    }

                    if (response.uid === requestUID) {
                        removeRejectHandler();
                        removeResponseHandler();
                        reject(response.error);
                    }
                },
            );

            this.broadcast({
                uid: requestUID,
                request: requestParameters,
            });
        });
    }
}

