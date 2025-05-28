import {run} from 'testring';

run(async (api) => {
    const app = api.application;
    await app.client.setCustomBrowserClientConfig({
        hostname: 'localhost',
        port: 8080,
        headers: {
            'X-Testring-Custom-Header': 'TestringCustomValue',
        },
    });
    const config = await app.client.getCustomBrowserClientConfig();
    await app.assert.equal(
        config.headers['X-Testring-Custom-Header'],
        'TestringCustomValue',
    );
    await app.url('https://example.com');
    // make api request to localhost:8080/selenium-headers to retrieve captured headers
    const response = await api.http.get({
        url: 'http://localhost:8080/selenium-headers',
    });
    const parsedResponse = JSON.parse(response);
    await app.assert.isAbove(parsedResponse.length, 0);
    for (let capturedHeaders of parsedResponse) {
        await app.assert.equal(
            capturedHeaders['x-testring-custom-header'],
            'TestringCustomValue',
        );
    }
});
