/// <reference types="mocha" />

import * as chai from 'chai';
import {FSFileUniqPolicy} from '@testring/types';

import {cbGen} from '../src/onFileName';

const testData: Record<string, any> = {
    'tmp.tmp': {workerId: 'abc', type: 'test', fullPath: 'test/tmp.abc.tmp'},
    'tmp_0.tmp': {type: 'tmp', fullPath: 'tmp/tmp_0.tmp'},
    'tmp_1.tmp': {type: 'tt', subtype: 'aa', fullPath: 'tt/tmp_1.aa.tmp'},
};

describe('fs-store-plugin', () => {
    it('should init fss and test the transport lock', () => {
        const fsPlugin = cbGen({test: './test', tmp: './tmp', tt: './tt'});

        const fNames = Object.keys(testData);

        return Promise.all(
            fNames.map(async (fileName) => {
                const metaData = testData[fileName];
                const fullPath = await fsPlugin(fileName, {
                    workerId: metaData.workerId,
                    requestId: 'tmp',
                    fileName,
                    meta: {
                        fileName,
                        type: metaData.type,
                        subtype: metaData.subtype,
                        uniqPolicy: metaData.workerId
                            ? FSFileUniqPolicy.worker
                            : FSFileUniqPolicy.global,
                        workerId: metaData.workerId,
                    },
                });
                // Normalize path separators for cross-platform compatibility
                const normalizedFullPath = fullPath.replace(/\\/g, '/');
                chai.expect(normalizedFullPath).to.be.equals(metaData.fullPath);
            }),
        );
    });
});
