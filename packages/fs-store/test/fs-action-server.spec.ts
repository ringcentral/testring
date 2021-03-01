/// <reference types="mocha" />

import * as chai from 'chai';

import { FSActionServer } from '../src/fs-action-server';
import { TransportMock } from '@testring/test-utils';

import { IQueStateReq, IQueStateResp } from '@testring/types';
import { FS_CONSTANTS } from '../src/utils';


const msgNamePrefix = 'fs-action';
const stateReq = msgNamePrefix + FS_CONSTANTS.FAS_REQ_ST_POSTFIX;
const stateResp = msgNamePrefix + FS_CONSTANTS.FAS_RESP_ST_POSTFIX;

// const reqName = msgNamePrefix +'_request_thread';
// const resName = msgNamePrefix +'_allow_thread';
// const releaseName = msgNamePrefix +'_release_thread';
// const cleanName = msgNamePrefix +'_release_worker_threads';

describe('fs-action-server', () => {
    it('should init fqs and test the transport', (done) => {
        const transport = new TransportMock();

        const FQS = new FSActionServer(10, msgNamePrefix, transport);

        chai.expect(FQS.getMsgPrefix()).to.be.equal(msgNamePrefix);
        chai.expect(FQS.getInitState()).to.be.a('number');

        const localRequestID = 'test';


        transport.on<IQueStateResp>(stateResp, ({ requestId, state }) => {
            chai.expect(requestId).to.be.equal(localRequestID);
            chai.expect(state).to.be.an('object');
            done();
        });


        transport.broadcastUniversally<IQueStateReq>(stateReq, { requestId: localRequestID });

    });

});
