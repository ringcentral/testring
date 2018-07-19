import { run } from 'testring';

run(async (api) => {
    const URL = 'https://service.ringcentral.com/';
    const COOKIE_NAME = 'TestCookie';
    const COOKIE_VALUE = '1337';

    const jar = api.http.createCookieJar();


    jar.setCookie(jar.createCookie({
        key: COOKIE_NAME,
        value: COOKIE_VALUE
    }), URL);

    await api.http.get({
        url: URL,
    }, jar);

    const cookies = jar.getCookies(URL);

    // passed cookie

    api.application.assert.equal(cookies[0].key, COOKIE_NAME);
    api.application.assert.equal(cookies[0].value, COOKIE_VALUE);

    // cookies from server

    api.application.assert.equal(cookies[1].key, 'RCRoutingInfo');
});


