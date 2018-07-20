import { run } from 'testring';

run(async (api) => {
    await api.application.openPage('https://service.ringcentral.com/');
});
