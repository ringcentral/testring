import {run} from 'testring';
import {getTargetUrl} from '../utils';
import * as path from 'path';
import * as fs from 'fs';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'timezone.html'));

    let filepath = path.join(__dirname, 'test.pdf');
    const result = await app.savePDF({
        filepath,
    });
    await app.assert.equal(Buffer.isBuffer(result), true);
    const isFileExists = fs.existsSync(filepath);
    await app.assert.equal(isFileExists, true);
});