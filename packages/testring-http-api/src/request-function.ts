import { IHttpRequest, IHttpResponse } from '@testring/types';
import { Response, OptionsWithUrl, jar } from 'request';
import * as requestPromise from 'request-promise';

const toString = c => c.toString();

const createCookieStore = (cookies: Array<string> | void, url: string) => {
    const cookieJar = jar();

    if (Array.isArray(cookies)) {
        cookies.forEach((c) => {
            cookieJar.setCookie(c, url);
        });
    }

    return cookieJar;
};

export const requestFunction = async (request: IHttpRequest): Promise<IHttpResponse> => {
    const cookieJar = createCookieStore(request.cookies, request.url);

    const normalizedRequest: OptionsWithUrl = {
        url: request.url,
        body: request.body,
        qs: request.query,
        method: request.method,
        timeout: request.timeout,
        headers: request.headers,
        json: true,
        jar: cookieJar
    };

    const response: Response = await requestPromise(normalizedRequest);
    const responseCookies = cookieJar.getCookies(request.url).map(toString);

    return {
        statusCode: response.statusCode,
        statusMessage: response.statusMessage,
        headers: response.headers,
        body: response.body,
        cookies: responseCookies
    };
};
