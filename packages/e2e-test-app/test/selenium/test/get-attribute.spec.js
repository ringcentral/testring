import { run } from 'testring';
import '../import-file';

async function test(api) {
    const application = api.application;

    await application.url('https://service.ringcentral.com/');

    await application.setValue(api.application.root.credential.input, '1111111111');
    await application.setValue(api.application.root.credential.input, '222');
    await application.setValue(api.application.root.credential.input, '33333');
    await application.setValue(api.application.root.credential.input, '4444');
    await application.setValue(api.application.root.credential.input, '55555');
    await application.setValue(api.application.root.credential.input, '6666');
    await application.setValue(api.application.root.credential.input, '1111111111');

    await api.application.click(
        api.application.root.loginCredentialNext
    );

    const attr = await api.application.getAttribute(
        api.application.root.signInBtn,
        'type'
    );

    await api.application.assert.equal(attr, 'submit');
}

run(test);
