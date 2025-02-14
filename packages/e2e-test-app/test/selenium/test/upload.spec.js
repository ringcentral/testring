import {run} from 'testring';
import {getTargetUrl} from './utils';
import * as path from 'path';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'upload.html'));

    const remoteFilePath = await app.uploadFile(path.join(__dirname, 'fixtures', 'LoremIpsum.pdf'));
    await app.setValue(app.root.uploadForm.fileInput, remoteFilePath);
    await app.click(app.root.uploadForm.uploadButton);
    let isFileUploaded = await app.isBecomeVisible(app.root.successIndicator);
    await app.assert.equal(isFileUploaded, true);
});