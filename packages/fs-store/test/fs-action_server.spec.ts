/// <reference types="mocha" />

import * as chai from 'chai';
// import * as sinon from 'sinon';

import { FSActionServer } from '../src/fs-action-server';
import { LocalTransport } from '../src/server_utils/LocalTransport';

import { IQueStateReq, IQueStateResp } from '@testring/types';

const msgNamePrefix = 'fs-q';
const testReq = msgNamePrefix + '_test';
const testResp = msgNamePrefix + '_test_resp';
// const reqName = msgNamePrefix +'_request_thread';
// const resName = msgNamePrefix +'_allow_thread';
// const releaseName = msgNamePrefix +'_release_thread';
// const cleanName = msgNamePrefix +'_release_worker_threads';

describe('fs-store-queue-server', () => {
    it('should init fqs and test the transport', (done) => {
        // const spy = sinon.spy();
        const transport = new LocalTransport();

        const FQS = new FSActionServer(10, msgNamePrefix, transport);

        chai.expect(FQS.getMsgPrefix()).to.be.equal(msgNamePrefix);
        chai.expect(FQS.getInitState()).to.be.a('number');

        const localRequestID = 'test';


        transport.on<IQueStateResp>(testResp, ({ requestId, state }) => {
            chai.expect(requestId).to.be.equal(localRequestID);
            chai.expect(state).to.be.an('object');
            done();
        });


        transport.broadcastUniversally<IQueStateReq>(testReq, { requestId: localRequestID });

    });

});
