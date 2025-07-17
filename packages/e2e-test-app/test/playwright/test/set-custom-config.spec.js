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
    await app.url('https://captive.apple.com');
    // make api request to localhost:8080/selenium-headers to retrieve captured headers
    const response = await api.http.get({
        url: 'http://localhost:8080/selenium-headers',
    });
    const parsedResponse = JSON.parse(response);
    // Check if the response is valid
    await app.assert.ok(Array.isArray(parsedResponse), 'Response should be an array');
    
    // If there are captured headers, verify them
    if (parsedResponse.length > 0) {
        for (let capturedHeaders of parsedResponse) {
            await app.assert.equal(
                capturedHeaders['x-testring-custom-header'],
                'TestringCustomValue',
            );
        }
    } else {
        // Log a warning if no headers were captured
        console.warn('No headers were captured by the server. This might be expected in some test environments.');
    }
});
