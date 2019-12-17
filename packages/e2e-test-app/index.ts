import * as childProcess from 'child_process';
import { MockWebServer } from './src/mock-web-server';

const mockWebServer = new MockWebServer();
mockWebServer.start();

const testringProcess = childProcess.exec(
    './node_modules/.bin/testring run --config ./test/selenium/config.js',
    {},
    (error, stdout, stderr) => {
        mockWebServer.stop();

        if (error) {
            throw error;
        }
    });

if (testringProcess.stdout) {
    testringProcess.stdout.pipe(process.stdout);
} else {
    console.warn('Cannot pipe stdout of child process');
}

if (testringProcess.stderr) {
    testringProcess.stderr.pipe(process.stderr);
} else {
    console.warn('Cannot pipe stderr of child process');
}
