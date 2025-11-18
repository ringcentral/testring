import {run} from 'testring';
import {assert} from 'chai';
import {getTargetUrl} from './utils';

run(async (api) => {
    const app = api.application;
    await app.url(getTargetUrl(api, 'screenshot.html'));

    const base64String = await app.makeElementScreenshot(app.root.testElement);

    assert.ok(
        typeof base64String === 'string' && base64String.length > 0,
        'makeElementScreenshot should return a non-empty string',
    );

    assert.doesNotThrow(
        () => Buffer.from(base64String, 'base64'),
        'returned string should be valid base64 encoded',
    );
});
