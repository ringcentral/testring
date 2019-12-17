import * as childProcess from 'child_process';
import { startWebServer, killWebServer } from './src/mock-web-server';

startWebServer();

const testringProcess = childProcess.exec(
    './node_modules/.bin/testring run --config ./test/selenium/config.js',
    {},
    (error, stdout, stderr) => {
        killWebServer();
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
