/* eslint no-unused-expressions: 0 */

/// <reference types="node" />
/// <reference types="mocha" />

import * as chai from 'chai';

import { locateTestFiles } from '../src/test-files-locator';

const exactTestPath = './test/fixtures/testfiles/foo.test.js';
const globTestPath = './test/fixtures/testfiles/**/**/*.test.js';
const falseGlobTestPath = './test/fixtures/testfiles/**/**/*.spec.js';
const excludedPath = './test/fixtures/testfiles/qux.js';

describe('testFilesLocator', () => {
    it('should return empty set if no searchpath passed', async () => {
        chai.expect(await locateTestFiles(undefined as any)).to.be.be.an('array').which.is.empty;
    });

    it('should return empty set if empty string passed as searchpath', async () => {
        chai.expect(await locateTestFiles('')).to.be.be.an('array').which.is.empty;
    });

    it('should return empty set if no files resolved by glob', async () => {
        chai.expect(await locateTestFiles(falseGlobTestPath)).to.be.be.an('array').which.is.empty;
    });

    it('should return array of length 1 if searchpath references to exact file', async () => {
        chai.expect(await locateTestFiles(exactTestPath)).to.be.an('array').of.length(1);
    });

    it('should return array of length 3 if passed glob searchpath', async () => {
        chai.expect(await locateTestFiles(globTestPath)).to.be.an('array').of.length(3);
    });

    it('should not contain files that doesn\'t match glob searchpath', async () => {
        chai.expect(await locateTestFiles(globTestPath)).to.not.include(excludedPath);
    });
});
