import { loggerClient } from '@testring/logger';
import { transport } from '@testring/transport';
import { WebApplication } from '@testring/web-application';

export class TestContent {

    private hasLoggedBusinessEvent = false;

    // TODO pass real test uid
    public application = new WebApplication('test', transport);

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
