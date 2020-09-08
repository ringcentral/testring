import { run } from 'testring';

run(async (api) => {
    await api.application.url('http://localhost:8080/screeshot.html');
    api.application.makeScreenshot();

    // Check saved screenshot
});
