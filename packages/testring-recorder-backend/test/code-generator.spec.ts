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
        const expectedCode = 'run(async api => {\n' +
            '  await api.application.url(\'https://service.ringcentral.com/\');\n' +
            '\n' +
            '  await api.application.click(api.application.root.credential);\n' +
            '\n' +
            '  await api.application.keys(\'1111111111\');\n' +
            '\n' +
            '  await api.application.click(api.application.root.loginCredentialNext);\n' +
            '\n' +
            '  const attr = await api.application.getAttribute(api.application.root.signInBtn, \'type\');\n' +
            '\n' +
            '  await api.application.click(api.application.root.first.second.third.fourth);\n' +
            '  await api.application.assert.equal(attr, \'submit\');\n' +
            '});';

        chai.expect(generateCode({
            cursor: cursorPosition,
            code,
            event: eventMock
        }).code).to.be.equal(expectedCode);
    });
    //TODO right at least four unit tests: with cursor check, with async wrapping,
    it('should give new cursor position', async () => {
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
        chai.expect(generateCode({
            cursor: cursorPosition,
            code,
            event: eventMock
        }).cursor).to.be.deep.equal({
            line: 18,
            column: 6
        });
    });
});
