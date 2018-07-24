/* eslint no-unused-expressions: 0 */


/// <reference types="mocha" />

import * as path from 'path';
import * as chai from 'chai';

import { resolveFile } from '../src/file-resolver';

const testPaths = [
    path.resolve(__dirname, './fixtures/testfiles/foo.test.js'),
    path.resolve(__dirname, './fixtures/testfiles/bar.test.js'),
    path.resolve(__dirname, './fixtures/testfiles/sub/baz.test.js')
];

const falsePaths = [
    path.resolve(__dirname, './fixtures/testfiles/_FOO.test.js'),
    path.resolve(__dirname, './fixtures/testfiles/_BAR.test.js'),
    path.resolve(__dirname, './fixtures/testfiles/_BAZ.test.js')
];

describe('resolve tests', () => {
    it('should throw error if no argument passed', (callback) => {
        resolveFile(undefined as any)
            .then(() => {
                callback('resolveTests did\'t throw');
            })
            .catch(() => {
                callback();
            })
            .catch(callback);
    });

    it('should throw error if empty array passed', (callback) => {
        resolveFile([])
            .then(() => {
                callback('resolveTests did\'t throw');
            })
            .catch(() => {
                callback();
            })
            .catch(callback);
    });

    it('should resolve array of objects that contain ', async () => {
        const res = await resolveFile(testPaths);

        res.forEach(file => {
            chai.expect(file).to.have.all.keys('path', 'content', 'meta');
        });
    });

    it('should resolve array of same length for array of valid files', async () => {
        chai.expect(await resolveFile(testPaths)).to.be.an('array').of.length(testPaths.length);
    });

    it('should resolve only existing files', async () => {
        const files = [...testPaths, ...falsePaths];
        const resolvedTests = await resolveFile(files);

        chai.expect(resolvedTests).to.be.an('array').of.length(testPaths.length);
    });

    it('should throw error if none of files passed to it was read', (callback) => {
        resolveFile(falsePaths)
            .then(() => {
                callback('resolveTests did\'t throw');
            })
            .catch(() => {
                callback();
            })
            .catch(callback);
    });
});
