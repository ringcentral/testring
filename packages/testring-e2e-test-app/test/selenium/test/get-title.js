import { run } from 'testring';

run(async (api) => {
    await api.application.url('https://www.ringcentral.com/');

    const title = await api.application.getTitle();

    await api.application.assert.equal(title, 'All-in-One Phone, Team Messaging, Video Conferencing | RingCentral');
});

