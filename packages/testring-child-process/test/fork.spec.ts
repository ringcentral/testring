/// <reference types="mocha" />

import * as path from 'path';
import * as chai from 'chai';
import { fork } from '../src/fork';

const fixtures = path.resolve(__dirname, './fixtures');

describe('fork', () => {
    // it('should fork .ts files with ts-node', (callback) => {
    //     const ps = fork(path.join(fixtures, 'typescript.ts'), ['--no-cache']);
    //
    //     ps.on('close', (error) => {
    //         if (error) {
    //             callback(error);
    //         } else {
    //             chai.expect(ps['spawnfile']).to.include('ts-node');
    //
    //             callback();
    //         }
    //     });
    //
    //     ps.kill();
    // });

    it('should fork .js files with node', (callback) => {
        const ps = fork(path.join(fixtures, 'javascript.js'));

        ps.on('close', (error) => {
            if (error) {
                callback(error);
            } else {
                chai.expect(ps['spawnfile'].endsWith('node')).to.equal(true);

                callback();
            }
        });

        ps.kill();
    });
});
