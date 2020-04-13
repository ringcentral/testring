import { run } from 'testring';

run(async (api) => {
    let mainTabId = await api.application.getMainTabId();
    await api.application.assert.isString(mainTabId);
    await api.application.assert.lengthOf(await api.application.windowHandles(), 1);

    await api.application.openPage('http://localhost:8080/scroll.html');
    await api.application.url('http://localhost:8080/title.html');
    await api.application.assert.equal(mainTabId, await api.application.getCurrentTabId());
    await api.application.assert.deepEqual(await api.application.windowHandles(), [mainTabId]);

    await api.application.newWindow(
        'http://localhost:8080/title.html',
        'first',
        {});
    let secondTabId = await api.application.getCurrentTabId();
    await api.application.assert.notEqual(mainTabId, secondTabId);
    await api.application.assert.deepEqual(
        await api.application.windowHandles(),
        [mainTabId, secondTabId]);

    // Opening url by windowName in same tab
    await api.application.newWindow(
        'http://localhost:8080/elements.html',
        'first',
        {});
    await api.application.assert.equal(secondTabId, await api.application.getCurrentTabId());


    await api.application.newWindow(
        'http://localhost:8080/scroll.html',
        'second',
        {});
    let thirdTabId = await api.application.getCurrentTabId();
    await api.application.assert.notEqual(mainTabId, thirdTabId);
    await api.application.assert.notEqual(secondTabId, thirdTabId);
    await api.application.assert.deepEqual(
        await api.application.windowHandles(),
        [mainTabId, secondTabId, thirdTabId]);

    // Switching tabs
    await api.application.switchToFirstSiblingTab();
    await api.application.assert.equal(secondTabId, await api.application.getCurrentTabId());

    await api.application.switchToMainSiblingTab(thirdTabId);
    await api.application.assert.equal(mainTabId, await api.application.getCurrentTabId());

    await api.application.window(thirdTabId);
    await api.application.assert.equal(thirdTabId, await api.application.getCurrentTabId());

    await api.application.newWindow('http://localhost:8080/title.html');
    await api.application.assert.notEqual(mainTabId, await api.application.getCurrentTabId());
    await api.application.assert.notEqual(secondTabId, await api.application.getCurrentTabId());
    await api.application.assert.notEqual(thirdTabId, await api.application.getCurrentTabId());
    let fourthTabId = await api.application.getCurrentTabId();

    await api.application.switchTab(thirdTabId);
    await api.application.assert.equal(thirdTabId, await api.application.getCurrentTabId());


    // Closing tabs
    await api.application.closeFirstSiblingTab();
    await api.application.switchTab(mainTabId);
    await api.application.assert.deepEqual(await api.application.windowHandles(), [mainTabId, thirdTabId, fourthTabId]);

    await api.application.newWindow('http://localhost:8080/title.html');
    let fifthTabId = await api.application.getCurrentTabId();

    await api.application.switchTab(thirdTabId);
    await api.application.closeCurrentTab();
    await api.application.assert.deepEqual(await api.application.windowHandles(), [mainTabId, fourthTabId, fifthTabId]);

    await api.application.closeAllOtherTabs();
    await api.application.assert.deepEqual(await api.application.windowHandles(), [mainTabId]);

    await api.application.switchTab(mainTabId);
    await api.application.assert.equal(mainTabId, await api.application.getCurrentTabId());

});
