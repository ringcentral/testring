/// <reference types="mocha" />

import * as chai from 'chai';

import { FSCollectionServer } from '../src/fs-collection-server';
import { TransportMock } from '@testring/test-utils';

import { IQueStateReq, IQueStateResp } from '@testring/types';
import { FS_CONSTANTS } from '../src/utils';


const msgNamePrefix = 'fs-action';
const stateReq = msgNamePrefix + FS_CONSTANTS.FS_COL_REQ_ST_POSTFIX;
const stateResp = msgNamePrefix + FS_CONSTANTS.FS_COL_RESP_ST_POSTFIX;

describe('fs-collection-server', () => {
    it('should init fscs and test the transport', function (done) {
        this.timeout(500);

        const transport = new TransportMock();

        new FSCollectionServer(msgNamePrefix, transport);


        const localRequestID = 'test';

        transport.on<IQueStateResp>(stateResp, ({ requestId, state }) => {
            chai.expect(requestId).to.be.equal(localRequestID);
            chai.expect(state).to.be.an('object');
            done();
        });


        transport.broadcastUniversally<IQueStateReq>(stateReq, { requestId: localRequestID });

    });

});
