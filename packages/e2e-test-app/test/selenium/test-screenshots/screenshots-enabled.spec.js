import {run} from 'testring';
import {unlink, stat} from 'fs';
import {promisify} from 'util';

import {assert} from 'chai';

const deleteFile = promisify(unlink);
const statFile = promisify(stat);

run(async (api) => {
    await api.application.url('http://localhost:8080/screenshot.html');
    const fName = await api.application.makeScreenshot();

    const fstat = await statFile(fName); // check for existence

    assert.ok(
        typeof fstat === 'object',
        'result of stat on file should be object',
    );

    // cleanup
    assert.doesNotThrow(
        async () => await deleteFile(fName),
        'error on delete screenshot',
    );
});
