import { run } from 'testring';

run(async (context) => {
    await context.application.url('https://service.ringcentral.com/');

    const val = await context.application.getText('loginCredentialTitle');

    await context.application.assert.equal(val, 'Sign In');
});

