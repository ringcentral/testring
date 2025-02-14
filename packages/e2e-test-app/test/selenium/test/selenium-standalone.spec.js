import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'form.html'));

    let gridInfo =  await app.client.gridTestSession();
    await app.assert.ok(gridInfo.localSelenium);

    let hubInfo = await app.client.getHubConfig();
    await app.assert.ok(hubInfo.localSelenium);
});