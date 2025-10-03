import {IHttpRequest, IHttpResponse} from '@testring/types';
import requestLib from 'request';
import requestPromise from 'request-promise-native';
import _ from 'lodash';

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

    const rawRequest = _.merge({}, request, {
        qs: request.query,
        jar: cookieJar,
        resolveWithFullResponse: true,
    });

    const response = await requestPromise(rawRequest);
    const cookies = cookieJar.getCookies(request.url).map(toString);

    return mapResponse(response, cookies);
}
