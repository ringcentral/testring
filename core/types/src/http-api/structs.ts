import {RequestPromiseOptions} from 'request-promise-native';

interface IHttpHeaders {
    [key: string]: any;
}

interface IHttpQueryParameters {
    [key: string]: any;
}

export interface IHttpResponse {
    statusCode: number;
    statusMessage: string;
    body: any;
    headers: IHttpHeaders;
    cookies: Array<any>;
}

export interface IHttpRequest extends RequestPromiseOptions {
    url: string;
    query?: IHttpQueryParameters;
    cookies?: Array<any>;
}

export interface IHttpRequestMessage {
    uid: string;
    request: IHttpRequest;
}

export interface IHttpResponseMessage {
    uid: string;
    response: IHttpResponse;
}

export interface IHttpResponseRejectMessage {
    uid: string;
    error: IHttpResponse;
}

export type HttpClientParams = {
    httpThrottle: number;
};
