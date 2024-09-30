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
    simple?: boolean;
    resolveWithFullResponse?: boolean;
    gzip?: boolean;
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
