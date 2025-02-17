import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    let mainTabId = await app.getMainTabId();
    await app.assert.isString(mainTabId);
    await app.assert.lengthOf(await app.getTabIds(), 1);

    await app.openPage(getTargetUrl(api, 'scroll.html'));
    await app.url(getTargetUrl(api, 'title.html'));
    await app.maximizeWindow();
    await app.assert.equal(mainTabId, await app.getCurrentTabId());
    await app.assert.deepEqual(await app.getTabIds(), [mainTabId]);

    await app.newWindow(getTargetUrl(api, 'title.html'), 'first', {});
    let secondTabId = await app.getCurrentTabId();
    await app.assert.notEqual(mainTabId, secondTabId);
    await app.assert.deepEqual(await app.getTabIds(), [mainTabId, secondTabId]);

    // Opening url by windowName in same tab
    await app.newWindow(getTargetUrl(api, 'elements.html'), 'first', {});
    await app.assert.equal(secondTabId, await app.getCurrentTabId());

    await app.newWindow(getTargetUrl(api, 'scroll.html'), 'second', {});
    let thirdTabId = await app.getCurrentTabId();
    await app.assert.notEqual(mainTabId, thirdTabId);
    await app.assert.notEqual(secondTabId, thirdTabId);
    await app.assert.deepEqual(await app.getTabIds(), [
        mainTabId,
        secondTabId,
        thirdTabId,
    ]);

    // Switching tabs
    await app.switchToFirstSiblingTab();
    await app.assert.equal(secondTabId, await app.getCurrentTabId());

    await app.switchToMainSiblingTab(thirdTabId);
    await app.assert.equal(mainTabId, await app.getCurrentTabId());

    await app.window(thirdTabId);
    await app.assert.equal(thirdTabId, await app.getCurrentTabId());

    await app.newWindow(getTargetUrl(api, 'title.html'));
    await app.assert.notEqual(mainTabId, await app.getCurrentTabId());
    await app.assert.notEqual(secondTabId, await app.getCurrentTabId());
    await app.assert.notEqual(thirdTabId, await app.getCurrentTabId());
    let fourthTabId = await app.getCurrentTabId();

    await app.switchTab(thirdTabId);
    await app.assert.equal(thirdTabId, await app.getCurrentTabId());

    // Closing tabs
    await app.closeFirstSiblingTab();
    await app.switchTab(mainTabId);
    await app.assert.deepEqual(await app.getTabIds(), [
        mainTabId,
        thirdTabId,
        fourthTabId,
    ]);

    await app.newWindow(getTargetUrl(api, 'title.html'));
    let fifthTabId = await app.getCurrentTabId();

    await app.switchTab(thirdTabId);
    await app.closeCurrentTab();
    await app.assert.deepEqual(await app.getTabIds(), [
        mainTabId,
        fourthTabId,
        fifthTabId,
    ]);

    await app.closeAllOtherTabs();
    await app.assert.deepEqual(await app.getTabIds(), [mainTabId]);

    await app.switchTab(mainTabId);
    await app.assert.equal(mainTabId, await app.getCurrentTabId());

    await app.closeCurrentTab();

    // Reinit current manager after all tabs are closed
    await app.openPage(getTargetUrl(api, 'scroll.html'));
    await app.maximizeWindow();
    mainTabId = await app.getCurrentTabId();
    await app.newWindow(getTargetUrl(api, 'title.html'));
    secondTabId = await app.getCurrentTabId();
    await app.newWindow(getTargetUrl(api, 'elements.html'));
    thirdTabId = await app.getCurrentTabId();

    let expectedWindows = [
        mainTabId,
        secondTabId,
        thirdTabId,
    ];
    await app.assert.deepEqual(await app.getTabIds(), expectedWindows);

    let windowHandles = await app.windowHandles();

    await app.assert.deepEqual(windowHandles, expectedWindows);

    let isChecked = await app.isChecked(app.root.checkbox1);
    await app.assert.equal(isChecked, false);
    await app.click(app.root.checkbox1);
    isChecked = await app.isChecked(app.root.checkbox1);
    await app.assert.equal(isChecked, true);
    await app.refresh();
    isChecked = await app.isChecked(app.root.checkbox1);
    await app.assert.equal(isChecked, false);

    await app.switchToFirstSiblingTab();
    await app.assert.equal(await app.getCurrentTabId(), secondTabId);

    await app.closeAllOtherTabs();
    await app.assert.deepEqual(await app.getTabIds(), [mainTabId]);

    let windowSize = await app.getWindowSize();
    await app.assert.isNumber(windowSize.width);
    await app.assert.isNumber(windowSize.height);
});
