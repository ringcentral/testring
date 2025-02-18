import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'focus-stable.html'));

    let isFocused = await app.isFocused(app.root.testInput);
    await app.assert.notOk(isFocused);
    await app.click(app.root.focusInputButton);
    isFocused = await app.isFocused(app.root.testInput);
    await app.assert.ok(isFocused);

    let isEnabled = await app.isEnabled(app.root.testButton);
    await app.assert.notOk(isEnabled);
    await app.click(app.root.enableButton);
    await app.waitForEnabled(app.root.testButton);
    isEnabled = await app.isEnabled(app.root.testButton);
    await app.assert.ok(isEnabled);

    let isStable = await app.isStable(app.root.testDiv);
    await app.assert.ok(isStable);
    await app.click(app.root.stabilizeElementButton);
    isStable = await app.isStable(app.root.testDiv);
    await app.assert.notOk(isStable);
    await app.waitForStable(app.root.testDiv);
    isStable = await app.isStable(app.root.testDiv);
    await app.assert.ok(isStable);
});