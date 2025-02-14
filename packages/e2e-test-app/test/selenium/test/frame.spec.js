import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'frame.html'));

    let isMainContentVisible = await app.isVisible(app.root.content);
    let isFrame1Visible = await app.isVisible(app.root.iframe1);
    let isFrame2Visible = await app.isVisible(app.root.iframe2);
    let isElementFromIframe1Visible = await app.isVisible(app.root.div1);
    let isElementFromIframe2Visible = await app.isVisible(app.root.div2);

    await app.assert.deepEqual(
        {
            isMainContentVisible,
            isFrame1Visible,
            isFrame2Visible,
            isElementFromIframe1Visible,
            isElementFromIframe2Visible
        },
        {
            isMainContentVisible: true,
            isFrame1Visible: true,
            isFrame2Visible: true,
            isElementFromIframe1Visible: false,
            isElementFromIframe2Visible: false
        }
    );

    let iframe1ID = await app.execute(() => {
        return document.querySelector('[data-test-automation-id="iframe1"]');
    });
    await app.switchToFrame(iframe1ID);
    isMainContentVisible = await app.isVisible(app.root.content);
    isElementFromIframe1Visible = await app.isVisible(app.root.div1);
    await app.assert.deepEqual({
        isMainContentVisible,
        isElementFromIframe1Visible
    }, {
        isMainContentVisible: false,
        isElementFromIframe1Visible: true
    });
    await app.switchToParentFrame();
    isMainContentVisible = await app.isVisible(app.root.content);
    isElementFromIframe1Visible = await app.isVisible(app.root.div1);
    await app.assert.deepEqual({
        isMainContentVisible,
        isElementFromIframe1Visible
    }, {
        isMainContentVisible: true,
        isElementFromIframe1Visible: false
    });
});