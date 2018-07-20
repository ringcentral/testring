export const enum HttpMessageType {
    send = 'sendHttpRequest',
    response = 'responseHttpRequest',
    reject = 'rejectHttpRequest'
}

export const enum HttpServerPlugins {
    beforeRequest = 'beforeRequest',
    beforeResponse = 'beforeResponse'
}

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

export interface IHttpRequest {
    url: string;
    method?: 'POST' | 'GET' | 'PUT' | 'DELETE';
    body?: any;
    timeout?: number;
    json?: any;
    headers?: IHttpHeaders;
    query?: IHttpQueryParameters;
    cookies?: Array<any>;
    resolveWithFullResponse?: boolean;
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

export interface IHttpCookieJar {
    setCookie(cookie: any, url: string): void;

    setCookies(cookies: Array<any>, url: string): void;

    getCookies(url: string): Array<any>;

    createCookie(properties: any): any;
}

export interface IHttpClient {
    send(options: IHttpRequest, cookieJar?: IHttpCookieJar): Promise<any>;

    delete(options: IHttpRequest, cookieJar?: IHttpCookieJar): Promise<any>;

    post(options: IHttpRequest, cookieJar?: IHttpCookieJar): Promise<any>;

    get(options: IHttpRequest, cookieJar?: IHttpCookieJar): Promise<any>;

    put(options: IHttpRequest, cookieJar?: IHttpCookieJar): Promise<any>;
}
