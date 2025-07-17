import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'screenshot.html'));
    const fName = await app.makeScreenshot();

    await app.assert.ok(fName === null, 'result of stat should be null');
});
