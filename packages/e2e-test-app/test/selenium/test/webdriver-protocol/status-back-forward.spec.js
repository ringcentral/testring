import {run} from 'testring';
import {getTargetUrl} from '../utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'form.html'));

    let status = await app.client.status();
    await app.assert.ok(status.ready);

    let isFormSelectVisible = await app.isVisible(app.root.form.select);
    await app.assert.ok(isFormSelectVisible);

    await app.url(getTargetUrl(api, 'get-size.html'));
    isFormSelectVisible = await app.isVisible(app.root.form.select);
    let isIconVisible = await app.isVisible(app.root.icon);
    await app.assert.notOk(isFormSelectVisible);
    await app.assert.ok(isIconVisible);

    await app.client.back();
    isFormSelectVisible = await app.isVisible(app.root.form.select);
    isIconVisible = await app.isVisible(app.root.icon);
    await app.assert.ok(isFormSelectVisible);
    await app.assert.notOk(isIconVisible);

    await app.client.forward();
    isFormSelectVisible = await app.isVisible(app.root.form.select);
    isIconVisible = await app.isVisible(app.root.icon);
    await app.assert.notOk(isFormSelectVisible);
    await app.assert.ok(isIconVisible);
});