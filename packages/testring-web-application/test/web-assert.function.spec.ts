//import * as chai from 'chai';
import { WebAssert } from '../src/web-assert';
import * as chai from 'chai';


describe('WebAssertion functional', () => {
    it('should pass with equal params', async () => {

        let webAssert = new WebAssert(false);

        try {
            await webAssert.equal(1,1);
            chai.expect(webAssert.errorMessages.length).to.be.equal(0);
        } catch (e) {
            throw new Error('Web assertion error');
        }

    });
    it('should pass with equal params (soft assertion)', async () => {

        let webAssert = new WebAssert(true);

        try {
            await webAssert.equal(1,1);
            chai.expect(webAssert.errorMessages.length).to.be.equal(0);
        } catch (e) {
            throw new Error('Web assertion error');
        }

    });
    it('should throw error with not equal params', async () => {

        let webAssert = new WebAssert(false);

        try {
            await webAssert.equal(1,2);
        } catch (e) {
            chai.expect(webAssert.errorMessages.length).to.be.equal(0);
            chai.expect(e).to.be.an.instanceof(Error);
        }

    });
    it('should pass with not equal params and add errors to errorMessages (soft assertion)', async () => {

        let webAssert = new WebAssert(true);
        try {
            await webAssert.equal(1,2);
            await webAssert.equal(2,3);
            await webAssert.equal(3,4);
        } catch (e) {
            throw new Error('Web assertion error');
        }
        chai.expect(webAssert.errorMessages.length).to.be.equal(3);
    });
});
