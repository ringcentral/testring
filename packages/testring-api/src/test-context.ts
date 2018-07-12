import { loggerClient } from '@testring/logger';
import { transport } from '@testring/transport';
import { WebApplication } from '@testring/web-application';
import { testAPIController } from './test-api-controller';

const LOG_PREFIX = '[logged inside test]';

export class TestContext {

    private lastLoggedBusinessEvent: string = '';

    private customApplications: Set<WebApplication> = new Set();

    public application = new WebApplication(testAPIController.getTestID(), transport);

    public async logBusiness(message: string) {
        if (this.lastLoggedBusinessEvent) {
            loggerClient.endStep(this.lastLoggedBusinessEvent);
        }

        this.lastLoggedBusinessEvent = message;

        loggerClient.startStep(message);
    }

    public async log(...message: Array<any>) {
        loggerClient.info(LOG_PREFIX, ...message);
    }

    public async logError(...message: Array<any>) {
        loggerClient.error(LOG_PREFIX, ...message);
    }

    public async logWarning(...message: Array<any>) {
        loggerClient.warn(LOG_PREFIX, ...message);
    }

    public getParameters(): any {
        return testAPIController.getTestParameters();
    }

    public initCustomApplication<T extends WebApplication = WebApplication>(Ctr: { new(...args: Array<any>): T; }) {
        const customApplication = new Ctr(testAPIController.getTestID(), transport);

        this.customApplications.add(customApplication);

        return customApplication;
    }

    public end() {
        const requests = [
            this.application.end()
        ];

        for (const customApplication of this.customApplications) {
            requests.push(
                customApplication.end()
            );
        }

        return Promise.all(requests);
    }
}
