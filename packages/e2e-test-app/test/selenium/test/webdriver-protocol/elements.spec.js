import {run} from 'testring';
import {getTargetUrl} from '../utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'elements.html'));

    let textareaElement = await app.elements(app.root.textarea);
    await app.click(app.root.textarea);
    let activeElement = await app.getActiveElement();
    await app.assert.equal(Object.values(activeElement)[0], textareaElement[0].ELEMENT);

    const location = await app.getLocation(app.root.textarea);
    await app.assert.equal(typeof location.x, 'number');
    await app.assert.equal(typeof location.y, 'number');
});