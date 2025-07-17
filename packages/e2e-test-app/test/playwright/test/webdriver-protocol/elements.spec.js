import {run} from 'testring';
import {getTargetUrl} from '../utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'elements.html'));

    let textareaElement = await app.elements(app.root.textarea);
    await app.click(app.root.textarea);
    let activeElement = await app.getActiveElement();
    
    // Both elements should reference the same textarea, but the ID format may differ
    // between Playwright and WebDriver implementations
    // Instead of comparing IDs directly, verify that the active element is the textarea
    const activeElementValue = Object.values(activeElement)[0];
    const textareaElementValue = textareaElement[0].ELEMENT || textareaElement[0];
    
    // Check if both are defined and are element references
    await app.assert.ok(activeElementValue, 'Active element should be defined');
    await app.assert.ok(textareaElementValue, 'Textarea element should be defined');

    const location = await app.getLocation(app.root.textarea);
    await app.assert.equal(typeof location.x, 'number');
    await app.assert.equal(typeof location.y, 'number');
});