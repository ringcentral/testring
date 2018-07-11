import { loggerClient } from '@testring/logger';
import { transport } from '@testring/transport';
import { WebApplication } from '@testring/web-application';
import { testAPIController } from './test-api-controller';

const LOG_PREFIX = '[logged inside test]';

export class TestContext {

    private lastLoggedBusinessEvent = '';

    public application = new WebApplication(testAPIController.getTestID(), transport);

    async logBusiness(message: string) {
        if (this.lastLoggedBusinessEvent) {
            loggerClient.endStep(this.lastLoggedBusinessEvent);
        }

        this.lastLoggedBusinessEvent = message;

        loggerClient.startStep(message);
    }

    async log(...message: Array<any>) {
        loggerClient.info(LOG_PREFIX, ...message);
    }

    async logError(...message: Array<any>) {
        loggerClient.error(LOG_PREFIX, ...message);
    }

    async logWarning(...message: Array<any>) {
        loggerClient.warn(LOG_PREFIX, ...message);
    }
}
