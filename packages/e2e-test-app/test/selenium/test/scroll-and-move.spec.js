import { run } from 'testring-dev';

run(async (api) => {
    await api.application.url('http://localhost:8080/scroll.html');

    await api.application.moveToObject(api.application.root.item_10);

    function getScrollTop(selector) {
        function getElementByXPath(xpath) {
            const element = document.evaluate(
                xpath,
                document,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null,
            );

            if (element.snapshotLength > 0) {
                return element.snapshotItem(0);
            }

            return null;
        }

        return getElementByXPath(selector).scrollTop;
    }
    const scrollTop = await api.application.execute(getScrollTop, api.application.root.container.toString());
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

    await api.application.scrollIntoView(api.application.root.button);
    let scrollTopView = await api.application.execute(() => document.scrollingElement.scrollTop);

    await api.application.scrollIntoView(api.application.root.button, -100);
    await api.application.assert.equal(
        scrollTopView-100,
        await api.application.execute(() => document.scrollingElement.scrollTop),
    );

    await api.application.scrollIntoViewIfNeeded(api.application.root.button);
    await api.application.click(api.application.root.button);
    await api.application.assert.equal(
        scrollTopView-100,
        await api.application.execute(() => document.scrollingElement.scrollTop),
    );
});
