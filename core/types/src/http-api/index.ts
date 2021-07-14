import { IHttpRequest } from './structs';

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
