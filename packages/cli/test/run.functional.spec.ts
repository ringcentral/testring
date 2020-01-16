/// <reference types="mocha" />

import * as path from 'path';
import { getConfig } from '@testring/cli-config';
import { Transport } from '@testring/transport';
import { runTests } from '../src/commands/run';

const fixturesPath = path.resolve(__dirname, './fixtures');

describe('testring CLI', () => {
    it('should run positive tests', async () => {
        const transport = new Transport();
        const config = await getConfig([
            '',
            `--tests=${path.join(fixturesPath, './tests/positive/*.spec.js')}`,
            '--retryDelay=10',
            '--silent',
        ]);

        const command = runTests(config, transport);

        await command.execute();
    });

    it('should fail on negative tests', async () => {
        const transport = new Transport();
        const config = await getConfig([
            '',
            `--tests=${path.join(fixturesPath, './tests/negative/*.spec.js')}`,
            '--retryDelay=10',
            '--silent',
        ]);

        let passed: boolean;

        try {
            const command = runTests(config, transport);

            await command.execute();
            passed = true;
        } catch {
            passed = false;
        }

        if (passed) {
            throw new Error('Tests finished somehow');
        }
    });

    it('should fail with empty config', (callback) => {
        const transport = new Transport();

        try {
            runTests({} as any, transport);
            callback('Tests finished somehow');
        } catch {
            callback();
        }
    });
});
