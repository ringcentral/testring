/// <reference types="node" />
/// <reference types="mocha" />

import * as path from 'path';
import { runTests } from '../src';

const fixturesPath = path.resolve(__dirname, './fixtures');

describe('testring CLI', () => {
    it('should run positive tests',  async () => {
        await runTests([
            '',
            `--tests=${path.join(fixturesPath, './tests/positive/*.spec.js')}`,
            '--retryDelay=10',
            '--silent'
        ]);
    });

    it('should fail on negative tests',   (callback) => {
        runTests([
            '',
            `--tests=${path.join(fixturesPath, './tests/negative/*.spec.js')}`,
            '--retryDelay=10',
            '--silent'
        ])
            .then(() => {
                callback('Tests finished somehow');
            })
            .catch(() => {
                callback();
            });
    });

    it('should fail with empty config',  (callback) => {
        runTests([''])
            .then(() => {
                callback('Tests finished somehow');
            })
            .catch(() => {
                callback();
            });
    });
});
