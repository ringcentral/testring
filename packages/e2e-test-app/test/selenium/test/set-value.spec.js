import { run } from 'testring';

run(async (api) => {
    await api.application.url('https://service.ringcentral.com/');

    await api.application.setValue(
        api.application.root.credential.input,
        'testRing'
    );

    const credentialValue = await api.application.getValue(
        api.application.root.credential.input
    );

    await api.application.assert.equal(credentialValue, 'testRing');

    await api.application.clearElement(
        api.application.root.credential.input,
        null
    );

    const emptyValue = await api.application.getValue(
        api.application.root.credential.input
    );

    await api.application.assert.equal(emptyValue, '');
});

