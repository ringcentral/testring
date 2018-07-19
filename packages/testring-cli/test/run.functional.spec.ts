/// <reference types="mocha" />

import * as path from 'path';
import { Writable } from 'stream';
import { getConfig } from '@testring/cli-config';
import { runTests } from '../src/commands/run';

const fixturesPath = path.resolve(__dirname, './fixtures');
const stdout = new Writable({
    write: () => {
    }
});

describe('testring CLI', () => {
    it('should run positive tests', async () => {
        const config = await getConfig([
            '',
            `--tests=${path.join(fixturesPath, './tests/positive/*.spec.js')}`,
            '--retryDelay=10',
            '--silent'
        ]);

        await runTests(config, stdout);
    });

    it('should fail on negative tests', async () => {
        const config = await getConfig([
            '',
            `--tests=${path.join(fixturesPath, './tests/negative/*.spec.js')}`,
            '--retryDelay=10',
            '--silent'
        ]);

        let passed: boolean;

        try {
            await runTests(config, stdout);
            passed = true;
        } catch {
            passed = false;
        }

        if (passed) {
            throw new Error('Tests finished somehow');
        }
    });

    it('should fail with empty config', (callback) => {
        runTests({} as any, stdout)
            .then(() => {
                callback('Tests finished somehow');
            })
            .catch(() => {
                callback();
            });
    });
});
