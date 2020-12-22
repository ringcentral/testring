import { run } from 'testring';

run(async (api) => {
    await api.application.url('http://localhost:8080/wait-for-exist.html');

    await api.application.click(api.application.root.showElement);
    await api.application.waitForExist(api.application.root.shouldExist);

    await api.application.waitForNotExists(api.application.root.invalidTestId, 2000);

    try {
        await api.application.waitForExist(api.application.root.invalidTestId, 2000).ifError('Test!');
    } catch (err) {
        await api.application.assert.equal(err.message, 'Test!');
    }

    try {
        await api.application.waitForExist(api.application.root.invalidTestId, 2000).ifError((err, xpath, timeout) => {
            return `Failed to find ${xpath} timeout ${timeout}`;
        });
    } catch (err) {
        await api.application.assert.equal(
            err.message,
            // eslint-disable-next-line max-len
            'Failed to find (//*[@data-test-automation-id=\'root\']//*[@data-test-automation-id=\'invalidTestId\'])[1] timeout 2000',
        );
    }
});
