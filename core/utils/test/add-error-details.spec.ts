/// <reference types="mocha" />

import * as chai from 'chai';
import {addErrorDetails} from '../src/add-error-details';

describe('addErrorDetails', () => {
    it('merges explicit details and keeps legacy fields on the error', () => {
        const error = Object.assign(new Error('failed'), {
            details: {first: 1},
        });

        addErrorDetails(error, {second: 2});

        chai.expect((error as any).details).to.deep.equal({first: 1, second: 2});
        chai.expect((error as any).first).to.equal(1);
        chai.expect((error as any).second).to.equal(2);
    });

    it('does not let details replace standard Error fields', () => {
        const error = new Error('original');

        addErrorDetails(error, {message: 'replacement', name: 'OtherError'});

        chai.expect(error.message).to.equal('original');
        chai.expect(error.name).to.equal('Error');
        chai.expect((error as any).details).to.deep.equal({});
    });
});
