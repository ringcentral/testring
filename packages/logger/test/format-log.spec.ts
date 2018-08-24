import * as chai from 'chai';
import { formatLog } from '../src/format-log';
import {
    LogLevel,
    LogTypes,
} from '@testring/types';

describe('Format log', () => {
    it('Info message with', () => {
        chai.expect(formatLog({
            time: new Date(2014, 1, 1, 12, 15,33,12),
            logLevel: LogLevel.info,
            type: LogTypes.info,
            content: [
                'test message'
            ],
            parentStep: null,
        }, false)).to.be.equal('[90m13:15:33[39m | [34m[info]   [39m test message');
    });

    it('Info message with and emoji', () => {
        chai.expect(formatLog({
            time: new Date(2014, 1, 1, 12, 15,33,12),
            logLevel: LogLevel.info,
            type: LogTypes.info,
            content: [
                'test message'
            ],
            parentStep: null,
        }, true)).to.be.equal('[90m13:15:33[39m | [34mℹ[39m test message');
    });

    it('Debug type message with prefix', () => {
        chai.expect(formatLog({
            time: new Date(2014, 1, 1, 22, 32,31,43),
            logLevel: LogLevel.debug,
            type: LogTypes.debug,
            content: [
                'test message'
            ],
            prefix: '[prefix]',
            parentStep: 'test',
        }, false)).to.be.equal('[90m23:32:31[39m | [1m[debug]  [22m [prefix] test message');
    });

    it('Step type text with prefix', () => {
        chai.expect(formatLog({
            time: new Date(2032, 7, 3, 24, 32,31,43),
            logLevel: LogLevel.error,
            type: LogTypes.step,
            content: [
                'test message'
            ],
            prefix: '[prefix]',
            parentStep: null,
        }, false)).to.be.equal('[90m00:32:31[39m | [31m[error]  [39m [prefix] [step] test message');
    });

    it('Log formatter media with prefix', () => {
        chai.expect(formatLog({
            time: new Date(2032, 7, 3, 24, 32,31,43),
            logLevel: LogLevel.verbose,
            type: LogTypes.media,
            content: [
                'filename'
            ],
            prefix: '[prefix]',
            parentStep: null,
        }, false)).to.be.equal('[90m00:32:31[39m | [90m[verbose][39m [prefix] [media] Filename: filename; Size: 0B;');
    });

    it('Log formatter media with prefix and file', () => {
        chai.expect(formatLog({
            time: new Date(2032, 7, 3, 24, 32,31,43),
            logLevel: LogLevel.silent,
            type: LogTypes.media,
            content: [
                'filename',
                Array.from({length: 1024}).map(() => '1'), // 1KB
            ],
            prefix: '[prefix]',
            parentStep: null,
        }, false)).to.be.equal('[90m00:32:31[39m | [37m[silent] [39m [prefix] [media] Filename: filename; Size: 1KB;');
    });
});
