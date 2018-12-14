import { run } from 'testring';

run(async (api) => {

    await api.application.url('https://service.ringcentral.com/');
    await api.application.setValue(api.application.root.credential.input, '1111111111');

    await api.application.click(
        api.application.root.loginCredentialNext
    );

    await api.application.waitForExist(
        api.application.root.password
    );
});

