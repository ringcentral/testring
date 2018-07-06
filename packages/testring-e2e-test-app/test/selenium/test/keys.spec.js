import { run } from 'testring';

run(async (context) => {
    await context.application.url('https://service.ringcentral.com/');
    await context.application.click('credential');
    await context.application.keys('testRing');

    const val = await context.application.getValue('credential');

    await context.application.assert.equal(val, 'testRing');
});

