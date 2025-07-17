import {run} from 'testring';

run(async (api) => {
    const app = api.application;
    
    // Test basic navigation
    await app.url('https://captive.apple.com');
    
    // Test title retrieval
    const title = await app.getTitle();
    await app.assert.include(title, 'Success');
    
    // Test simple navigation methods
    await app.url('https://httpbin.org/html');
    await app.refresh();
    
    // Test basic element methods
    const pageSource = await app.getSource();
    await app.assert.include(pageSource, 'html');
});