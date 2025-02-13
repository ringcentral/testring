import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'get-size.html'));

    let size = await app.getSize(app.root.icon);

    await app.assert.deepEqual(size, { width: 32, height: 32 });
});