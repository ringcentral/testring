import { run } from 'testring';

run(async (context) => {
    await context.application.url('https://service.ringcentral.com/');


    const val = await context.application.getText('loginCredentialTitle');

    if (val === 'Sign In') {
        console.log('test passed successfully');
    }
});

