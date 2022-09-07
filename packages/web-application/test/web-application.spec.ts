/// <reference types="mocha" />

import * as chai from 'chai';

import {TransportMock} from '@testring-dev/test-utils';
import {generateUniqId} from '@testring-dev/utils';
import {WebApplication} from '../src/web-application';

// TODO (flops) add more tests
describe('WebApplication functional', () => {
    it('should extend current instance', () => {
        const workerId = generateUniqId();
        const transport = new TransportMock();

        const webApplication = new WebApplication(workerId, transport);

        const link = webApplication.extendInstance({
            testProperty: 123,
        });

        chai.expect(link.testProperty).to.be.equal(123);
    });
});
