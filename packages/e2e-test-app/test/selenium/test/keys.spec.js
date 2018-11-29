import { run } from 'testring';

run(async (api) => {
    await api.application.url('https://service.ringcentral.com/');

    await api.application.click(
        api.application.root.credential.input
    );

    await api.application.keys('testRing');

    const credentialValue = await api.application.getValue(
        api.application.root.credential.input
    );

    await api.application.assert.equal(credentialValue, 'testRing');
});

