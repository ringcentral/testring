import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'form.html'));

    // Test the readonly input directly
    const selector = app.root.form.readonlyInput;
    console.log('Testing selector:', selector);
    
    // Check readonly
    const isReadonly = await app.isReadOnly(selector);
    console.log('isReadonly result:', isReadonly);
    
    // Let's also check the attribute directly
    const readonlyAttr = await app.getAttribute(selector, 'readonly');
    console.log('readonly attribute:', readonlyAttr);
    
    await app.assert.equal(isReadonly, true);
});