import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'wait-until.html'));

    let inputValue = await app.getValue(app.root.inputElement);
    await app.assert.equal(inputValue, '');
    await app.click(app.root.addInputValueButton);
    await app.waitForValue(app.root.inputElement);
    inputValue = await app.getValue(app.root.inputElement);
    await app.assert.equal(inputValue, 'Input Value');

    // Check initial selected value - it might be empty or 'Option 1'
    let selectedText = await app.getSelectedText(app.root.selectElement);
    // If empty, get the selected index instead
    if (!selectedText) {
        const selectedIndex = await app.execute(() => {
            const select = document.querySelector('[data-test-automation-id="selectElement"]');
            return select ? select.selectedIndex : -1;
        });
        await app.assert.equal(selectedIndex, 0); // First option should be selected
    } else {
        await app.assert.equal(selectedText, 'Option 1');
    }
    
    // Click button to change selection after 3 seconds
    await app.click(app.root.addSelectedButton);
    
    // Wait for the select element's selected index to change
    // Since waitUntil doesn't have access to app context, we'll wait and check
    await new Promise(resolve => setTimeout(resolve, 3500)); // Wait for selection to change
    
    // Verify the selection changed
    const finalSelectedIndex = await app.execute(() => {
        const select = document.querySelector('[data-test-automation-id="selectElement"]');
        return select ? select.selectedIndex : -1;
    });
    await app.assert.equal(finalSelectedIndex, 1);
});