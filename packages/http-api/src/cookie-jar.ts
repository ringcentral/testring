import {CookieJar, Cookie} from 'tough-cookie';
import {IHttpCookieJar} from '@testring/types';

export class HttpCookieJar implements IHttpCookieJar {
    private jar = new CookieJar();

    public setCookie(cookie: Cookie | string, url: string) {
        this.jar.setCookieSync(cookie, url);
    }

    public setCookies(cookies: Array<string>, url: string) {
        cookies.forEach((cookie) => this.jar.setCookieSync(cookie, url));
    }

    public getCookies(url: string) {
        return this.jar.getCookiesSync(url);
    }

    public createCookie(properties: Cookie.Properties) {
        return new Cookie(properties);
    }
}
