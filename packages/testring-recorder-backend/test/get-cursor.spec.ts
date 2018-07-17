/// <reference types="mocha" />

import * as chai from 'chai';
import { fileReaderFactory } from '@testring/test-utils';
import { getCursor } from '../src/get-cursor';


describe('get-cursor', () => {
    it('should get available position for cursor according to the current position', async () => {
        const reader = fileReaderFactory(__dirname, './fixtures');
        const code = await reader('sample-code.js');
        const currentPosition = {
            line: 3,
            column: 10
        };
        const newCursorPosition = getCursor(code, currentPosition);
        chai.expect(newCursorPosition).to.be.deep.equal({
            line: 3,
            column: 14
        });
    });
    it('should give position of end of the arrow function when cursor is inside function with no return', async () => {
        const reader = fileReaderFactory(__dirname, './fixtures');
        const code = await reader('sample-code.js');
        const currentPosition = {
            line: 10,
            column: 44
        };
        const newCursorPosition = getCursor(code, currentPosition);
        chai.expect(newCursorPosition).to.be.deep.equal({
            line: 10,
            column: 47
        });
    });
    it('should handle cursor in function name', async () => {
        const reader = fileReaderFactory(__dirname, './fixtures');
        const code = await reader('sample-code.js');
        const currentPosition = {
            line: 5,
            column: 16
        };
        const newCursorPosition = getCursor(code, currentPosition);
        chai.expect(newCursorPosition).to.be.deep.equal({
            line: 9,
            column: 5
        });
    });
});
