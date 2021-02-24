import { run } from 'testring';
import { unlink, stat } from 'fs';
import { promisify } from 'util';

import * as assert from 'assert';

const deleteFile = promisify(unlink);
const statFile = promisify(stat);

run(async (api) => {
    await api.application.url('http://localhost:8080/screenshot.html');
    const fName = await api.application.makeScreenshot();

    const stat = await statFile(fName);// check for existence

    assert.ok(typeof(stat) === 'object', 'result of stat on file should be object');
    
    // cleanup
    assert.doesNotThrow(async () => await deleteFile(fName), 'error on delete screenshot');
    
});
