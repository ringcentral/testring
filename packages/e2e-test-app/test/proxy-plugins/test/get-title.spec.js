import { run } from 'testring';

function delay(timeout) {
    return new Promise((resolve) => setTimeout(() => resolve(), timeout));
}

run(async (api) => {
    await api.application.url('https://www.ringcentral.com/');

    const title = await api.application.getTitle();

    await api.application.assert.include(title, 'RingCentral');
});

