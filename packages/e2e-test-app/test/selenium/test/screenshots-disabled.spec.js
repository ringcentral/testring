import {run} from 'testring';

run(async (api) => {
    await api.application.url('http://localhost:8080/screenshot.html');
    const fName = await api.application.makeScreenshot();

    await api.application.assert.ok(
        fName === null,
        'result of stat should be null',
    );
});