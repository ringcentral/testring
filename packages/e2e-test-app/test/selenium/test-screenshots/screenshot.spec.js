import { run } from 'testring';
import { unlink, stat } from 'fs';
import { promisify } from 'util';

const deleteFile = promisify(unlink);
const statFile = promisify(stat);

run(async (api) => {
    await api.application.url('http://localhost:8080/screenshot.html');
    const fName = await api.application.makeScreenshot();

    await statFile(fName);// check for existence

    // cleanup
    await deleteFile(fName);
    // Check saved screenshot
});
