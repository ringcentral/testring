import { loggerClient } from '@testring/logger';
import { transport } from '@testring/transport';
import { WebApplication } from '@testring/web-application';
import { testAPIController } from './test-api-controller';

export class TestContext {

    private hasLoggedBusinessEvent = false;

    public application = new WebApplication(testAPIController.getTestID(), transport);

    async logBusiness(message: string) {
        if (this.hasLoggedBusinessEvent) {
            loggerClient.endStep();
        } else {
            this.hasLoggedBusinessEvent = true;
        }

        loggerClient.startStep(message);
    }

    async logError(message) {
        loggerClient.error(message);
    }

    async logWarning(...message: Array<any>) {
        loggerClient.warn(message);
    }
}
