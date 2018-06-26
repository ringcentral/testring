import { WebApplication } from '../../src/web-application';


const application = new WebApplication('test-item');

setImmediate(async () => {
    await application.click('some-element');
});
