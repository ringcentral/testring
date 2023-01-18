/// <reference types="mocha" />

import * as path from 'path';
import * as chai from 'chai';
import {fork} from '../src/fork';

const fixtures = path.resolve(__dirname, './fixtures');

describe('fork', () => {
    it('should fork .js files with node', (callback) => {
        fork(path.join(fixtures, 'javascript.js')).then((ps) => {
            ps.on('exit', (code, signal) => {
                if (signal) {
                    callback(signal);
                } else {
                    chai.expect(ps['spawnfile'].endsWith('node')).to.equal(
                        true,
                    );

                    callback();
                }
            });
        });
    });
});
