/// <reference types="mocha" />

import * as chai from 'chai';

import { TransportMock } from '@testring/test-utils';
import { WebApplication } from '../src/web-application';

const nanoid = require('nanoid');

// TODO add more tests
describe('WebApplication functional', () => {
    it('should extend current instance', () => {
        const workerId = nanoid();
        const transport = new TransportMock();

        const webApplication = new WebApplication(workerId, transport);

        let link = webApplication.extendInstance({
           testProperty: 123,
        });

        chai.expect(link.testProperty).to.be.equal(123);

    });
});
