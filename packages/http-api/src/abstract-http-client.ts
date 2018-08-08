import {
    HttpMessageType,
    ITransport,
    IHttpClient,
    IHttpCookieJar,
    IHttpRequest,
    IHttpResponseMessage,
    IHttpRequestMessage,
    IHttpResponseRejectMessage
} from '@testring/types';
import { loggerClient } from '@testring/logger';
import { HttpCookieJar } from './cookie-jar';

const nanoid = require('nanoid');

const toString = c => c.toString();

export abstract class AbstractHttpClient implements IHttpClient {
    protected abstract broadcast(options: IHttpRequestMessage): void;

    constructor(protected transportInstance: ITransport) {
    }

    public post(options: IHttpRequest, cookieJar?: IHttpCookieJar): Promise<any> {
        return this.sendRequest({ ...options, method: 'POST' }, cookieJar);
    }

    public get(options: IHttpRequest, cookieJar?: IHttpCookieJar): Promise<any> {
        return this.sendRequest({ ...options, method: 'GET' }, cookieJar);
    }

    public delete(options: IHttpRequest, cookieJar?: IHttpCookieJar): Promise<any> {
        return this.sendRequest({ ...options, method: 'DELETE' }, cookieJar);
    }

    public put(options: IHttpRequest, cookieJar?: IHttpCookieJar): Promise<any> {
        return this.sendRequest({ ...options, method: 'PUT' }, cookieJar);
    }

    public send(options: IHttpRequest, cookieJar?: IHttpCookieJar): Promise<any> {
        return this.sendRequest({ ...options }, cookieJar);
    }

    public createCookieJar() {
        return new HttpCookieJar();
    }

    private isValidData(data: any): boolean {
        return (data !== null && data !== undefined);
    }

    private isValidRequest(request: IHttpRequest): boolean {
        return (this.isValidData(request) && request.hasOwnProperty('url'));
    }

    private async sendRequest(requestParameters: IHttpRequest, cookieJar?: IHttpCookieJar): Promise<any> {
        if (cookieJar) {
            requestParameters = {
                ...requestParameters,
                cookies: cookieJar.getCookies(requestParameters.url).map(toString)
            };
        }

        if (!this.isValidRequest(requestParameters)) {
            loggerClient.error(`Http Client: ${requestParameters} request is not valid`);

            throw new Error('request is not valid');
        }

        const requestUID = nanoid();

        return new Promise((resolve, reject) => {
            const removeResponseHandler = this.transportInstance.on(
                HttpMessageType.response,
                (response: IHttpResponseMessage) => {
                    if (!response.uid) {
                        loggerClient.error('Http Client: no response uid');
                        throw new Error('no uid');
                    }

                    if (response.uid === requestUID) {
                        removeResponseHandler();
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
                }
            );

            const removeRejectHandler = this.transportInstance.on(
                HttpMessageType.reject,
                (response: IHttpResponseRejectMessage) => {
                    if (!response.uid) {
                        loggerClient.error('Http Client: no response uid');
                        throw new Error('no uid');
                    }

                    if (response.uid === requestUID) {
                        removeRejectHandler();
                        removeResponseHandler();
                        reject(response.error);
                    }
                }
            );

            this.broadcast({
                uid: requestUID,
                request: requestParameters
            });
        });
    }
}

