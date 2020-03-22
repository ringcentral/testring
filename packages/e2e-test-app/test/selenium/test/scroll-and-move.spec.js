import { run } from 'testring';

run(async (api) => {
    await api.application.url('http://localhost:8080/scroll.html');

    await api.application.moveToObject(api.application.root.item_10);

    const scrollTop = await api.application.getAttribute(api.application.root.container, 'scrollTop');
    const mouseOverResult10 = await api.application.getText(api.application.root.mouseOverResult);

    await api.application.assert.isAtLeast(+scrollTop, 140);
    await api.application.assert.equal(mouseOverResult10, '10');

    await api.application.scroll(api.application.root.container.item_1);

    const scrollTopAfterScrollingToFirstItem = await api.application.getAttribute(
        api.application.root.container, 'scrollTop',
    );
    await api.application.assert.isAtMost(+scrollTopAfterScrollingToFirstItem, 30);

    await api.application.moveToObject(api.application.root.item_1);
    const mouseOverResult1 = await api.application.getText(api.application.root.mouseOverResult);
    await api.application.assert.equal(mouseOverResult1, '1');
});
