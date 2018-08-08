/* eslint no-unused-expressions: 0 */


/// <reference types="mocha" />

import * as path from 'path';
import * as chai from 'chai';
import { FSReader } from '../src/fs-reader';

const glob = path.resolve(__dirname, './fixtures/testfiles/**/**/*.test.js');
const falseGlob = path.resolve(__dirname, './fixtures/testfiles/**/**/*.spec.ts');

describe('TestsFinder', () => {
    it('should throw error if no path passed', (callback) => {
        const fsReader = new FSReader();

        fsReader.find(undefined as any)
            .then(() => {
                callback('it didn\'t throw');
            })
            .catch(() => {
                callback();
            });
    });

    it('should throw error if no files to passed glob', (callback) => {
        const fsReader = new FSReader();

        fsReader.find(falseGlob)
            .then(() => {
                callback('it didn\'t throw');
            })
            .catch(() => {
                callback();
            });
    });

    it('should resolve files from glob', async () => {
        const fsReader = new FSReader();
        const tests = await fsReader.find(glob);

        chai.expect(tests).to.be.an('array').that.not.empty;
    });
});
