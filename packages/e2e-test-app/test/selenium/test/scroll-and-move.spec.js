import { run } from 'testring';

run(async (api) => {
    await api.application.url('http://localhost:8080/scroll.html');

    await api.application.moveToObject(api.application.root.item_10);

    const scrollTop = await api.application.getAttribute(api.application.root.container, 'scrollTop');
    await api.application.assert.equal(scrollTop, 140);

    await api.application.scroll(api.application.root.container.item_1);

    const scrollTopAfterScrollingToFirstItem = await api.application.getAttribute(
        api.application.root.container, 'scrollTop'
    );
    await api.application.assert.equal(scrollTopAfterScrollingToFirstItem, 0);
});
