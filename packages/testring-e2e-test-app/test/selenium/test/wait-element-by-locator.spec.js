import { run } from 'testring';

run(async (context) => {

    await context.application.url('https://service.ringcentral.com/');
    await context.application.click('credential');
    await context.application.keys('1111111111');
    await context.application.click('loginCredentialNext');
    await context.application.waitElementByLocator('password');

});

