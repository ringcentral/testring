import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'get-source.html'));

    let source = await app.getSource();

    await app.assert.ok(source.includes('<!-- test comment -->'));
});