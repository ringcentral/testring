import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'cookie.html'));
    const cookieValue = await app.getCookie('test');
    await app.assert.equal(cookieValue, 'TestData');

    await app.deleteCookie('test');
    await app.click(app.root.cookie_clear_button);

    const cookieTextAfterDelete = await app.getText(app.root.cookie_found_text);
    await app.assert.equal(cookieTextAfterDelete, '');

    const cookieTextGetter = await app.getCookie('test');
    await app.assert.equal(cookieTextGetter, undefined);

    await app.setCookie({name: 'foo', value: '1111'});
    const cookieValueAfterAdd = await app.getCookie('foo');
    await app.assert.equal(cookieValueAfterAdd, '1111');

    const allCookies = await app.getCookie();
    const expected = [
        {
            domain: 'localhost',
            httpOnly: false,
            name: 'foo',
            path: '/',
            secure: false,
            value: '1111',
            sameSite: 'Lax',
        },
    ];
    await app.assert.deepEqual(allCookies, expected);
    await app.deleteCookie();
    const allCookiesAfterDelete = await app.getCookie();
    await app.assert.deepEqual(allCookiesAfterDelete, []);
});
