/* eslint no-unused-expressions: 0 */

/// <reference types="mocha" />

import * as path from 'path';
import * as chai from 'chai';
import {FSReader} from '../src/fs-reader';
import * as process from 'node:process';
import * as fs from 'node:fs';

const runPerformanceTests =
    process.env['PERFORMANCE_TESTS'] === 'true' ||
    process.argv.includes('--performance');
const glob = path.resolve(__dirname, './fixtures/testfiles/**/**/*.test.js');

const writeTestFiles = async (count: number) => {
    const dir = path.resolve(__dirname, './fixtures/testfiles/performance');

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    for (let i = 0; i < count; i++) {
        const file = path.resolve(dir, `test${i}.test.js`);
        await fs.promises.writeFile(file, `console.log('test${i}');`);
    }
};

const removeTestFiles = async () => {
    const dir = path.resolve(__dirname, './fixtures/testfiles/performance');

    if (fs.existsSync(dir)) {
        await fs.promises.rm(dir, {recursive: true, force: true});
    }
};

describe('Performance', function () {
    this.timeout(120000);
    if (!runPerformanceTests) {
        it('Performance tests are disabled. To enable them set PERFORMANCE_TESTS=true environment variable', () => {
            chai.expect(true).to.be.true;
        });
    } else {
        describe('FSReader', () => {
            before(async () => {
                await writeTestFiles(15000);
            });

            after(async () => {
                await removeTestFiles();
            });

            it('should resolve files from glob up to 5 seconds', async () => {
                const fsReader = new FSReader();
                const start = Date.now();
                const tests = await fsReader.find(glob);
                const end = Date.now();
                const duration = end - start;
                chai.expect(duration).to.be.lessThan(5000);
                chai.expect(tests).to.be.an('array').that.not.empty;
                chai.expect(tests).to.have.lengthOf(15003);
            });
        });
    }
});
