import {IHttpRequest, IHttpResponse} from '@testring/types';
import * as requestLib from 'request';
import * as requestPromise from 'request-promise-native';

const toString = (c: requestLib.Cookie) => c.toString();

function createCookieStore(cookies: Array<string> | void, url: string) {
    const cookieJar = requestLib.jar();

    if (Array.isArray(cookies)) {
        cookies.forEach((c) => {
            cookieJar.setCookie(c, url);
        });
    }

    return cookieJar;
}

const mapResponse = (response: requestLib.Response, cookies: string[]) => ({
    statusCode: response.statusCode,
    statusMessage: response.statusMessage,
    headers: response.headers,
    body: response.body,
    cookies,
});

export async function requestFunction(
    request: IHttpRequest,
): Promise<IHttpResponse> {
    const cookieJar = createCookieStore(request.cookies, request.url);

    const rawRequest: requestPromise.RequestPromiseOptions & { url: string } = {
        url: request.url,
        qs: request.query,
        body: request.body,
        method: request.method,
        timeout: request.timeout,
        headers: request.headers,
        json: request.json,
        gzip: request.gzip,
        jar: cookieJar,
        resolveWithFullResponse: true,
    };

    const response = await requestPromise.default(rawRequest);
    const cookies = cookieJar.getCookies(request.url).map(toString);

    return mapResponse(response, cookies);
}
