import {run} from 'testring-dev';

run(async (api) => {
    const originUrl = 'http://localhost:8080/title.html';
    const mockUrl = 'http://localhost:8080/mock.html';

    await api.application.client.mock(originUrl, mockUrl);
    await api.application.client.mock(mockUrl, function (res) {
        res.body = res.body.replace(
            '</head>',
            '<script>window.__MOCK_INJECT=true</script></head>',
        );
    });
    await api.application.url(originUrl);
    await api.application.assert.isTrue(
        await api.application.execute(() => window.__MOCK_INJECT),
    );
    await api.application.assert.equal(
        await api.application.getTitle(),
        'Mock test',
    );

    const [mockResponse] = await api.application.client.getMockData(mockUrl);
    await api.application.assert.include(
        mockResponse.body,
        '<script>window.__MOCK_INJECT=true</script></head>',
    );
});
