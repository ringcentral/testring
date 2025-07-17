import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'form.html'));

    // Test the keys functionality
    const selector = '[data-test-automation-id="nameInput"]';
    
    // Set a value first
    console.log('Setting initial value...');
    await app.setValue(selector, 'testValueKeys');
    
    // Get initial value
    let value = await app.getValue(selector);
    console.log('Initial value:', value);
    
    // Click to focus the input
    console.log('Clicking input to focus...');
    await app.click(selector);
    
    // Try Control+A to select all
    console.log('Sending Control+A...');
    await app.keys(['Control', 'A']);
    
    // Add a small delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Send Backspace to delete
    console.log('Sending Backspace...');
    await app.keys(['Backspace']);
    
    // Add a small delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check final value
    value = await app.getValue(selector);
    console.log('Final value:', value);
    console.log('Expected: empty string');
    console.log('Test result:', value === '' ? 'PASS' : 'FAIL');
});