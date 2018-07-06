/// <reference types="node" />
/// <reference types="mocha" />

import * as chai from 'chai';
import { createAssertion } from '../src/assert';


describe('assertion functional', () => {
    it('should pass with equal params', async () => {
        const assert = createAssertion(false);

        try {
            await assert.equal(1,1);
            
            chai.expect(assert.errorMessages.length).to.be.equal(0);
        } catch (e) {
            throw new Error('Web assertion error');
        }

    });
    it('should pass with equal params (soft assertion)', async () => {
        const assert = createAssertion(true);

        try {
            await assert.equal(1,1);
            chai.expect(assert.errorMessages.length).to.be.equal(0);
        } catch (e) {
            throw new Error('Web assertion error');
        }

    });
    it('should throw error with not equal params', async () => {
        const assert = createAssertion(false);

        try {
            await assert.equal(1,2);
        } catch (e) {
            chai.expect(assert.errorMessages.length).to.be.equal(0);
            chai.expect(e).to.be.an.instanceof(Error);
        }

    });
    it('should pass with not equal params and add errors to errorMessages (soft assertion)', async () => {

        const assert = createAssertion(true);
        try {
            await assert.equal(1,2);
            await assert.equal(2,3);
            await assert.equal(3,4);
        } catch (e) {
            throw new Error('Assertion error');
        }

        chai.expect(assert.errorMessages.length).to.be.equal(3);
    });
});
