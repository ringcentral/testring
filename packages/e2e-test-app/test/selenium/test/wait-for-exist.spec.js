import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'wait-for-exist.html'));

    await app.click(app.root.showElement);
    await app.waitForExist(app.root.shouldExist);

    await app.waitForNotExists(app.root.invalidTestId, 2000);

    try {
        await app.waitForExist(app.root.invalidTestId, 2000).ifError('Test!');
    } catch (err) {
        await app.assert.equal(err.message, 'Test!');
    }

    try {
        await app
            .waitForExist(app.root.invalidTestId, 2000)
            .ifError((err, xpath, timeout) => {
                return `Failed to find ${xpath} timeout ${timeout}`;
            });
    } catch (err) {
        await app.assert.equal(
            err.message,
            // eslint-disable-next-line max-len
            "Failed to find (//*[@data-test-automation-id='root']//*[@data-test-automation-id='invalidTestId'])[1] timeout 2000",
        );
    }
});
