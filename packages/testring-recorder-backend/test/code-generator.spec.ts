/// <reference types="mocha" />

import * as chai from 'chai';
import { fileReaderFactory } from '@testring/test-utils';
import { generateCode } from '../src/generate-code';

describe('code-generator', () => {
    it('should generate code according to user actions(click, keyup and etc.)', async () => {
        const reader = fileReaderFactory(__dirname, './fixtures/code-generation');
        const code = await reader('code-generation-entry.js');
        const cursorPosition = {
            line: 17,
            column: 6
        };
        const eventMock = {
            'event': 'RecorderEvents/RECORDING',
            'payload': {
                'type': 'RecordingEventTypes/CLICK',
                'elementPath': [
                    {'id': 'first'},
                    {'id': 'second'},
                    {'id': 'third'},
                    {'id': 'fourth'}]
            }
        };
        const resultCode = await reader('code-generation-result.js');
        console.log(generateCode({
            cursor: cursorPosition,
            code,
            event: eventMock}));
        chai.expect(generateCode({
            cursor: cursorPosition,
            code,
            event: eventMock
        }).code).to.be.equal(resultCode);

    });
});
