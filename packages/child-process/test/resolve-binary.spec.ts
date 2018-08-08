/// <reference types="mocha" />

import * as chai from 'chai';
import { resolveBinary } from '../src/resolve-binary';

describe('resolveBinary', () => {
    it('should resolve binary correctly', () => {
        const path = resolveBinary('ts-node');

        chai.expect(path).to.include('ts-node');
    });

    it('should throw, if there is no such binary', (callback) => {
        try {
            const invalidResult = resolveBinary('some-package-without-bin');

            callback(`Resolver found something: ${invalidResult}`);
        } catch (e) {
            chai.expect(e).to.be.instanceof(Error);

            callback();
        }
    });

    it('should throw, if package exists, but doesn\'t have bin', (callback) => {
        try {
            const invalidResult = resolveBinary('chai');

            callback(`Resolved some bin: ${invalidResult}`);
        } catch (e) {
            chai.expect(e).to.be.instanceof(Error);

            callback();
        }
    });
});
