/* eslint no-unused-expressions: 0 */


/// <reference types="mocha" />

import * as path from 'path';
import * as chai from 'chai';
import { FSReader } from '../src/fs-reader';

const glob = path.resolve(__dirname, './fixtures/testfiles/**/**/*.test.js');
const falseGlob = path.resolve(__dirname, './fixtures/testfiles/**/**/*.spec.ts');

describe('TestsFinder', () => {
    it('should throw error if no path passed', (callback) => {
        const testFinder = new FSReader();

        testFinder.find(undefined as any)
            .then(() => {
                callback('it didn\'t throw');
            })
            .catch(() => {
                callback();
            });
    });

    it('should throw error if no files to passed glob', (callback) => {
        const testFinder = new FSReader();

        testFinder.find(falseGlob)
            .then(() => {
                callback('it didn\'t throw');
            })
            .catch(() => {
                callback();
            });
    });

    it('should resolve files from glob', async () => {
        const testFinder = new FSReader();
        const tests = await testFinder.find(glob);

        chai.expect(tests).to.be.an('array').that.not.empty;
    });
});
