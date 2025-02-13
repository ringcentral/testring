import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'wait-for-visible.html'));

    let isInfoSectionVisible = await app.isVisible(app.root.infoSection.infoText);

    await app.assert.equal(isInfoSectionVisible, false);

    await app.click(app.root.appearButton);

    await app.waitForVisible(app.root.infoSection.infoText);

    isInfoSectionVisible = await app.isVisible(app.root.infoSection.infoText);

    await app.assert.equal(isInfoSectionVisible, true);

    await app.click(app.root.disappearButton);
    let isInfoSectionVisibleBefore = await app.isVisible(app.root.infoSection.infoText);
    await app.waitForNotVisible(app.root.infoSection.infoText);
    let isInfoSectionVisibleAfter = await app.isVisible(app.root.infoSection.infoText);

    await app.assert.equal(isInfoSectionVisibleBefore, true);
    await app.assert.equal(isInfoSectionVisibleAfter, false);
});