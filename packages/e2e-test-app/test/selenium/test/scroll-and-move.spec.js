import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'scroll.html'));

    await app.moveToObject(app.root.item_10);

    function getScrollTop(selector) {
        function getElementByXPath(xpath) {
            const element = document.evaluate(
                xpath,
                document,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null,
            );

            if (element.snapshotLength > 0) {
                return element.snapshotItem(0);
            }

            return null;
        }

        return getElementByXPath(selector).scrollTop;
    }
    const scrollTop = await app.execute(
        getScrollTop,
        app.root.container.toString(),
    );
    const mouseOverResult10 = await app.getText(app.root.mouseOverResult);

    await app.assert.isAtLeast(+scrollTop, 140);
    await app.assert.equal(mouseOverResult10, '10');

    await app.scroll(app.root.container.item_1);

    const scrollTopAfterScrollingToFirstItem = await app.getAttribute(
        app.root.container,
        'scrollTop',
    );
    await app.assert.isAtMost(+scrollTopAfterScrollingToFirstItem, 30);

    await app.moveToObject(app.root.item_1);
    const mouseOverResult1 = await app.getText(app.root.mouseOverResult);
    await app.assert.equal(mouseOverResult1, '1');

    await app.scrollIntoView(app.root.button);
    let scrollTopView = await app.execute(
        () => document.scrollingElement.scrollTop,
    );

    await app.scrollIntoView(app.root.button, -100);
    await app.assert.equal(
        scrollTopView - 100,
        await app.execute(() => document.scrollingElement.scrollTop),
    );

    await app.scrollIntoViewIfNeeded(app.root.button);
    await app.click(app.root.button);
    await app.assert.equal(
        scrollTopView - 100,
        await app.execute(() => document.scrollingElement.scrollTop),
    );
});
