import * as request from 'request';
import { OptionsWithUrl } from 'request-promise';

export const enum HttpMessageType {
    send = 'sendHttpRequest',
    response = 'responseHttpRequest',
    reject = 'rejectHttpRequest'
}

export const enum HttpServerPlugins {
    beforeRequest = 'beforeRequest',
    beforeResponse = 'beforeResponse'
}

export interface IHttpResponse {
    response: request.Response;
    uid: string;
}

export interface IHttpResponseReject {
    error: request.Response;
    uid: string;
}

export interface IHttpRequest {
    request: OptionsWithUrl;
    uid: string;
}

export interface IHttpClient {
    post(options: OptionsWithUrl): Promise<any>;

    get(options: OptionsWithUrl): Promise<any>;

    delete(options: OptionsWithUrl): Promise<any>;

    put(options: OptionsWithUrl): Promise<any>;
}
