import { WebApplication } from '../../src/web-application';
import { ELEMENT_NAME, TEST_NAME } from './constants';

const application = new WebApplication(TEST_NAME);

setImmediate(async () => {
    await application.waitForExist(ELEMENT_NAME);
});
