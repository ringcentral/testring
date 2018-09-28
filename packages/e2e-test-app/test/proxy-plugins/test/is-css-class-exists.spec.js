import { run } from 'testring';

run(async (api) => {
    await api.application.url('https://service.ringcentral.com/');

    await api.logBusiness('redirecting');

    await api.application.setValue(api.application.root.credential.input, '1111111111');

    await api.application.click(
        api.application.root.loginCredentialNext
    );

    await api.logBusiness('checking class');

    const isClassExists = await api.application.isCSSClassExists(
        api.application.root.signInBtn,
        'btn'
    );

    await api.application.assert.isOk(isClassExists);
});
