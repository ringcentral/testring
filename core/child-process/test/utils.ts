/// <reference types="mocha" />

import * as chai from 'chai';
import { isChildProcess } from '../src/utils';


describe('isChildProcess', () => {
    it('not child args', () => {
        chai.expect(isChildProcess([])).to.be.equal(false);
    });
    it('child args', () => {
        chai.expect(isChildProcess(['--some=argument', '--testring-parent-pid=10'])).to.be.equal(true);
    });
});
