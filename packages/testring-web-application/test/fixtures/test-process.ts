import { Transport } from '@testring/transport';
import { WebApplication } from '../../src/web-application';
import { ELEMENT_NAME, TEST_NAME } from './constants';

const transport = new Transport();
const application = new WebApplication(TEST_NAME, transport);

setTimeout(() => {
    application.url(ELEMENT_NAME);
}, 100);
