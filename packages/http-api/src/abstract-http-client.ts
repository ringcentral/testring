import process from 'node:process';
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
import {LoggerClient, loggerClient} from '@testring/logger';
import {Queue, generateUniqId} from '@testring/utils';
import {HttpCookieJar} from './cookie-jar';
import {safeUrl} from './safe-url';

const toString = (c: any) => c.toString();

export abstract class AbstractHttpClient implements IHttpClient {
    protected abstract broadcast(options: IHttpRequestMessage): void;

    protected loggerClient: LoggerClient =
        loggerClient.withPrefix('[http client]');

    private requestQueue: IQueue<Function>;

    private params: HttpClientParams = {
        httpThrottle: 0,
        httpResponseTimeout: 120_000,
    };

    private queueRunning = false;

    protected log(level: 'debug' | 'warn' | 'error', ...args: any[]) {
        try {
            this.loggerClient[level](...args);
        } catch {
            // Diagnostics must not keep an HTTP request pending.
        }
    }

    constructor(
        protected transportInstance: ITransport,
        params: Partial<HttpClientParams> = {},
    ) {
        this.requestQueue = new Queue();

        this.params = Object.assign<
            HttpClientParams,
            Partial<HttpClientParams>
        >(this.params, params);

        if (
            !Number.isFinite(this.params.httpResponseTimeout) ||
            this.params.httpResponseTimeout <= 0
        ) {
            throw new RangeError(
                'httpResponseTimeout must be a positive finite number',
            );
        }
    }

    public post(
        options: IHttpRequest,
        cookieJar?: IHttpCookieJar,
    ): Promise<any> {
        return this.pushToQueue({...options, method: 'POST'}, cookieJar);
    }

    public get(
        options: IHttpRequest,
        cookieJar?: IHttpCookieJar,
    ): Promise<any> {
        return this.pushToQueue({...options, method: 'GET'}, cookieJar);
    }

    public delete(
        options: IHttpRequest,
        cookieJar?: IHttpCookieJar,
    ): Promise<any> {
        return this.pushToQueue({...options, method: 'DELETE'}, cookieJar);
    }

    public put(
        options: IHttpRequest,
        cookieJar?: IHttpCookieJar,
    ): Promise<any> {
        return this.pushToQueue({...options, method: 'PUT'}, cookieJar);
    }

    public send(
        options: IHttpRequest,
        cookieJar?: IHttpCookieJar,
    ): Promise<any> {
        return this.pushToQueue({...options}, cookieJar);
    }

    public createCookieJar() {
        return new HttpCookieJar();
    }

    private isValidData(data: any): boolean {
        return data !== null && data !== undefined;
    }

    private isValidRequest(request: IHttpRequest): boolean {
        return (
            this.isValidData(request) &&
            Object.prototype.hasOwnProperty.call(request, 'url')
        );
    }

    private async throttleDelay() {
        await new Promise((resolve) =>
            setTimeout(resolve, this.params.httpThrottle),
        );
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

    private pushToQueue(
        requestParameters: IHttpRequest,
        cookieJar?: IHttpCookieJar,
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            const sendRequest = () =>
                this.sendRequest(requestParameters, cookieJar).then(
                    resolve,
                    reject,
                );

            this.requestQueue.push(sendRequest);
            // TODO (flops) move throttling into HttpServer
            this.runQueue();
        });
    }

    // TODO (flops) refactor this function
    // eslint-disable-next-line sonarjs/cognitive-complexity
    private async sendRequest(
        requestParameters: IHttpRequest,
        cookieJar?: IHttpCookieJar,
    ): Promise<any> {
        if (cookieJar) {
            requestParameters = {
                ...requestParameters,
                cookies: cookieJar
                    .getCookies(requestParameters.url)
                    .map(toString),
            };
        }

        if (!this.isValidRequest(requestParameters)) {
            this.loggerClient.error(
                `${requestParameters} request is not valid`,
            );

            throw new Error('request is not valid');
        }

        const requestUID = generateUniqId();
        const method = requestParameters.method || 'GET';
        const url = safeUrl(requestParameters.url);

        return new Promise((resolve, reject) => {
            let removeResponseHandler: () => void = (): void => undefined;
            let removeRejectHandler: () => void = (): void => undefined;
            let settled = false;
            const timeout: {timer?: NodeJS.Timeout} = {};
            const cleanup = () => {
                clearTimeout(timeout.timer);
                removeResponseHandler();
                removeRejectHandler();
            };
            const finish = (
                callback: typeof resolve | typeof reject,
                value: any,
            ) => {
                if (!settled) {
                    settled = true;
                    cleanup();
                    callback(value);
                }
            };
            removeResponseHandler = this.transportInstance.on(
                HttpMessageType.response,
                (response: IHttpResponseMessage) => {
                    if (!response.uid) {
                        this.loggerClient.error('no response uid');
                        throw new Error('no uid');
                    }

                    if (response.uid === requestUID) {
                        this.log('debug', 'HTTP request completed', {
                            event: 'http_request_completed',
                            uid: requestUID,
                            source: String(process.pid),
                            method,
                            url,
                            messageType: HttpMessageType.response,
                        });
                        if (cookieJar) {
                            cookieJar.setCookies(
                                response.response.cookies,
                                requestParameters.url,
                            );
                        }

                        if (requestParameters.resolveWithFullResponse) {
                            finish(resolve, response.response);
                        } else {
                            finish(resolve, response.response.body);
                        }
                    }
                },
            );

            removeRejectHandler = this.transportInstance.on(
                HttpMessageType.reject,
                (response: IHttpResponseRejectMessage) => {
                    if (!response.uid) {
                        this.loggerClient.error('no response uid');
                        throw new Error('no uid');
                    }

                    if (response.uid === requestUID) {
                        this.log('warn', 'HTTP request rejected', {
                            event: 'http_request_rejected',
                            uid: requestUID,
                            source: String(process.pid),
                            method,
                            url,
                            messageType: HttpMessageType.reject,
                            requestFailure: {
                                name: response.error?.name,
                                statusCode: (response.error as any)?.statusCode,
                                code: (response.error as any)?.code,
                            },
                        });
                        finish(reject, response.error);
                    }
                },
            );

            timeout.timer = setTimeout(() => {
                const error = new Error(
                    `HTTP request ${method} ${url} (${requestUID}) timed out after ${this.params.httpResponseTimeout}ms`,
                );
                error.name = 'HTTP_RESPONSE_TIMEOUT';
                (error as any).code = 'HTTP_RESPONSE_TIMEOUT';
                (error as any).uid = requestUID;
                this.log('error', 'HTTP response timeout', {
                    event: 'http_response_timeout',
                    uid: requestUID,
                    source: String(process.pid),
                    method,
                    url,
                    messageType: `${HttpMessageType.response}|${HttpMessageType.reject}`,
                    phase: 'timeout',
                    timeoutMs: this.params.httpResponseTimeout,
                });
                finish(reject, error);
            }, this.params.httpResponseTimeout);

            try {
                this.log('debug', 'HTTP request started', {
                    event: 'http_request_started',
                    uid: requestUID,
                    source: String(process.pid),
                    method,
                    url,
                    messageType: HttpMessageType.send,
                });
                this.broadcast({
                    uid: requestUID,
                    request: requestParameters,
                });
            } catch (error) {
                finish(reject, error);
            }
        });
    }
}
