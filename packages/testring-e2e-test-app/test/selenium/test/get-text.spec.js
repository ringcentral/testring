import { run } from 'testring';

run(async (api) => {
    await api.application.url('https://service.ringcentral.com/');

    const loginTitle = await api.application.getText(
        api.application.root.loginCredentialTitle.toString()
    );

    await api.application.assert.equal(loginTitle, 'Sign In');
});

