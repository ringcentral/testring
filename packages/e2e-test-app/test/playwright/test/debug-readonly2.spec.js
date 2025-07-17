import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'form.html'));

    // Test the readonly input directly with a simple CSS selector
    console.log('Testing with CSS selector [data-test-automation-id="readonlyInput"]');
    const result1 = await app.execute(() => {
        const element = document.querySelector('[data-test-automation-id="readonlyInput"]');
        if (element) {
            return {
                found: true,
                tagName: element.tagName,
                hasAttribute: element.hasAttribute('readonly'),
                readOnlyProperty: element.readOnly,
                getAttribute: element.getAttribute('readonly')
            };
        }
        return { found: false };
    });
    console.log('Direct element check result:', JSON.stringify(result1));
    
    // Test our isReadOnly method
    const isReadonly = await app.isReadOnly('[data-test-automation-id="readonlyInput"]');
    console.log('isReadOnly method result:', isReadonly);
});