import * as childProcess from 'child_process';
import {MockWebServer} from './mock-web-server';

const mockWebServer = new MockWebServer();

const filenameArgIndex = process.argv.indexOf(__filename);
const args = process.argv.slice(filenameArgIndex + 1);

async function runTests() {
    await mockWebServer.start();

    const testringProcess = childProcess.exec(
        `./node_modules/.bin/testring ${args.join(' ')}`,
        {},
        (error, stdout, stderr) => {
            mockWebServer.stop();

            if (error) {
                throw error;
            }
        },
    );

    if (testringProcess.stdout) {
        testringProcess.stdout.pipe(process.stdout);
    }

    if (testringProcess.stderr) {
        testringProcess.stderr.pipe(process.stderr);
    }
}

runTests().catch(() => process.exit(1));
