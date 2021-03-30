/// <reference types="mocha" />

import * as chai from 'chai';

import { FSCollectionServer } from '../src/fs-collection-server';
import { FSCollectionClient } from '../src/fs-collection-client';
// import { logger } from '../src/utils';

// const log = logger.getNewLog({ m: 'fsc-test' });

// import {
//     fsReqType,
// } from '@testring/types';

new FSCollectionServer();


describe('fs-collection-client', () => {
    it('client should lock access & unlink data', async function () {

        this.timeout(500);

        const FSCC = new FSCollectionClient();

        const loaded = ['1', '2'];
        const check1 = ['3', '4'];
        const check2 = ['1', '2', '3', '4'];
        const check3 = ['4', '5', '6'];

        const expect3 = ['5', '6'];

        const colName = 'test';


        const res0 = await FSCC.filter(loaded, colName) as { filtered: string[] };
        chai.expect(res0.filtered).to.be.deep.equal(loaded);


        const state = await FSCC.confirmLoad(loaded, colName, true);
        chai.expect(state).to.be.deep.equal(loaded);

        const res1 = await FSCC.filter(check1, colName) as { filtered: string[] };
        chai.expect(res1.filtered).to.be.deep.equal(check1);
        await FSCC.confirmLoad(check1, colName);


        const res2 = await FSCC.filter(check2, colName) as { filtered: string[] };
        chai.expect(res2.filtered).to.be.deep.equal([]);

        const res3 = await FSCC.filter(check3, colName) as { filtered: string[] };
        chai.expect(res3.filtered).to.be.deep.equal(expect3);

    });
});
