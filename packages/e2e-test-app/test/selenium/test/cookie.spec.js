import { run } from 'testring';

run(async (api) => {
    await api.application.url('http://localhost:8080/cookie.html');
    const cookieValue = await api.application.getCookie('test');
    await api.application.assert.equal(cookieValue, 'TestData');

    await api.application.deleteCookie('test');
    await api.application.click(api.application.root.cookie_clear_button);

    const cookieTextAfterDelete = await api.application.getText(api.application.root.cookie_found_text);
    await api.application.assert.equal(cookieTextAfterDelete, '');

    try {
        await api.application.getCookie('test');
        throw new Error('Cookie object is still exists');
    } catch (e) { /* ignore */ }

    await api.application.setCookie({ 'name': 'test', 'value': '1111' });
    const cookieValueAfterAdd = await api.application.getCookie('test');
    await api.application.assert.equal(cookieValueAfterAdd, '1111');
});
