import { run } from 'testring';

run(async (api) => {

    await api.application.url('https://service.ringcentral.com/');
    await api.application.click(
        api.application.root.credential.toString()
    );

    await api.application.keys('1111111111');

    await api.application.click(
        api.application.root.loginCredentialNext.toString()
    );

    await api.application.waitElementByLocator(
        api.application.root.password.toString()
    );
});

