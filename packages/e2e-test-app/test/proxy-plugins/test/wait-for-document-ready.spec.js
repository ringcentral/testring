import { run } from 'testring';

run(async (api) => {
    await api.application.url('https://service.ringcentral.com/');
});
