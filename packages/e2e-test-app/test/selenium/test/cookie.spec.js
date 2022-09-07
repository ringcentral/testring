import { run } from 'testring-dev';

run(async (api) => {
    await api.application.url('http://localhost:8080/cookie.html');
    const cookieValue = await api.application.getCookie('test');
    await api.application.assert.equal(cookieValue, 'TestData');

    await api.application.deleteCookie('test');
    await api.application.click(api.application.root.cookie_clear_button);

    const cookieTextAfterDelete = await api.application.getText(api.application.root.cookie_found_text);
    await api.application.assert.equal(cookieTextAfterDelete, '');

    const cookieTextGetter = await api.application.getCookie('test');
    await api.application.assert.equal(cookieTextGetter, undefined);

    await api.application.setCookie({ 'name': 'foo', 'value': '1111' });
    const cookieValueAfterAdd = await api.application.getCookie('foo');
    await api.application.assert.equal(cookieValueAfterAdd, '1111');

    const allCookies = await api.application.getCookie();
    const expected = [{
        'domain':'localhost',
        'httpOnly':false,
        'name':'foo',
        'path':'/',
        'secure':false,
        'value':'1111',
    }];
    await api.application.assert.deepEqual(allCookies, expected);
    await api.application.deleteCookie();
    const allCookiesAfterDelete = await api.application.getCookie();
    await api.application.assert.deepEqual(allCookiesAfterDelete, []);
});
