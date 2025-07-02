import * as childProcess from 'child_process';
import {MockWebServer} from './mock-web-server';
import * as path from 'node:path';

const mockWebServer = new MockWebServer();

const filenameArgIndex = process.argv.indexOf(__filename);
const args = process.argv.slice(filenameArgIndex + 1);
const testringDir = path.resolve(require.resolve('testring'), '..', '..');
const testringFile = path.resolve(testringDir, 'bin', 'testring.js');

async function runTests() {
    await mockWebServer.start();

    const testringProcess = childProcess.exec(
        `node ${testringFile} ${args.join(' ')}`,
        {},
        (error, _stdout, _stderr) => {
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

    testringProcess.on('unhandledRejection', (reason, promise) => {
        // eslint-disable-next-line no-console
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    testringProcess.on('uncaughtException', (error) => {
        // eslint-disable-next-line no-console
        console.error('Uncaught Exception:', error);
    });
}

runTests().catch(() => process.exit(1));
