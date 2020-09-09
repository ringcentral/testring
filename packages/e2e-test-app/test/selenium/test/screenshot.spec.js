import { run } from 'testring';

run(async (api) => {
    await api.application.url('http://localhost:8080/screenshot.html');
    await api.application.makeScreenshot();

    // Check saved screenshot
});
