/// <reference types="mocha" />

import * as chai from 'chai';
import { createAssertion } from '..';


describe('assertion functional', () => {
    it('should pass with equal params', async () => {
        const assert = createAssertion();

        try {
            await assert.equal(1, 1);

            chai.expect(assert._errorMessages.length).to.be.equal(0);
        } catch (e) {
            throw new Error('Web assertion error');
        }
    });

    it('should pass with equal params (soft assertion)', async () => {
        const assert = createAssertion({ isSoft: true });

        try {
            await assert.equal(1, 1);
            chai.expect(assert._errorMessages.length).to.be.equal(0);
        } catch (e) {
            throw new Error('Web assertion error');
        }
    });

    it('should throw error with not equal params', async () => {
        const assert = createAssertion({ isSoft: false });

        try {
            await assert.equal(1, 2);
        } catch (e) {
            chai.expect(assert._errorMessages.length).to.be.equal(0);
            chai.expect(e).to.be.an.instanceof(Error);
        }
    });

    it('should pass with not equal params and add errors to._errorMessages (soft assertion)', async () => {
        const assert = createAssertion({ isSoft: true });

        try {
            await assert.equal(1, 2);
            await assert.equal(2, 3);
            await assert.equal(3, 4);
        } catch (e) {
            throw new Error('Assertion error');
        }

        chai.expect(assert._errorMessages.length).to.be.equal(3);
    });

    it('should call onSuccess assertion callback', async (callback) => {
        const assert = createAssertion({
            onSuccess: (meta) => {
                try {
                    chai.expect(meta).to.be.deep.equal({
                        assertMessage: '[assert] equal(act = 1, exp = 1)',
                        isSoft: false,
                        successMessage: '',
                        originalMethod: 'equal',
                        args: [1, 1],
                    });
                    callback();
                } catch (e) {
                    callback(e);
                }
            },
        });

        try {
            await assert.equal(1, 1);
        } catch (e) {
            throw new Error('Web assertion error');
        }
    });

    it('should call onError assertion callback', async (callback) => {
        const assert = createAssertion({
            onError: (meta) => {
                chai.expect(meta.error).to.be.an.instanceof(Error);

                delete meta.error;

                try {
                    chai.expect(meta).to.be.deep.equal({
                        assertMessage: '[assert] equal(act = 1, exp = 2)',
                        errorMessage: 'expected 1 to equal 2',
                        isSoft: false,
                        successMessage: '',
                        originalMethod: 'equal',
                        args: [1, 2],
                    });
                    callback();
                } catch (e) {
                    callback(e);
                }
            },
        });

        try {
            await assert.equal(1, 2);
        } catch (ignore) { /* ignore */ }
    });

    it('should call onError assertion callback without changed error object', async () => {
        const assert = createAssertion({
            onError: (meta) => { },
        });

        try {
            await assert.equal(1, 2);
        } catch (error) {
            chai.expect(error).to.be.an.instanceof(Error);
            chai.expect(error.message).to.be.eq('[assert] equal(act = 1, exp = 2)');
        }
    });

    it('should call onError assertion callback with different Error', async () => {
        const overloadMessage = 'Overloaded message';
        let originalError;

        const assert = createAssertion({
            onError: (meta) => {
                const tmpErr = new Error();
                originalError = meta.error;
                tmpErr.message = overloadMessage;
                tmpErr.stack = meta.error.stack;

                return tmpErr;
            },
        });

        try {
            await assert.equal(1, 2);
        } catch (error) {
            chai.expect(error).to.be.an.instanceof(Error);
            chai.expect(error.message).to.be.eq(overloadMessage);
            chai.expect(error.stack).to.be.eq(originalError.stack);
        }
    });
});
