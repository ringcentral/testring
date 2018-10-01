import { loggerClient } from '@testring/logger';
import { HttpClient } from '@testring/http-api';
import { transport } from '@testring/transport';
import { WebApplication } from '@testring/web-application';
import { testAPIController } from './test-api-controller';

const LOG_PREFIX = '[logged inside test]';

export class TestContext {

    private _application: WebApplication;

    private lastLoggedBusinessMessage: string | null = null;

    private customApplications: Set<WebApplication> = new Set();

    public http = new HttpClient(transport);

    public get application() {
        if (this._application) {
            return this._application;
        }

        const runData = this.getRunData();

        this._application = new WebApplication(testAPIController.getTestID(), transport, runData);

        return this._application;
    }

    public async logBusiness(message: string) {
        this.stopLogBusiness();

        this.lastLoggedBusinessMessage = message;

        loggerClient.startStep(message);
    }

    public async stopLogBusiness() {
        if (this.lastLoggedBusinessMessage !== null) {
            loggerClient.endStep(this.lastLoggedBusinessMessage);

            this.lastLoggedBusinessMessage = null;
        }
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

    protected getRunData(): any {
        return this.getParameters().runData;
    }

    public getParameters(): any {
        return testAPIController.getTestParameters();
    }

    public getEnvironment(): any {
        return testAPIController.getEnvironmentParameters();
    }

    public initCustomApplication<T extends WebApplication = WebApplication>(Ctr: { new(...args: Array<any>): T; }) {
        const runData = this.getRunData();
        const customApplication = new Ctr(testAPIController.getTestID(), transport, runData);

        this.customApplications.add(customApplication);

        return customApplication;
    }

    public getCustomApplicationsList() {
        return [...this.customApplications];
    }

    public end(): Promise<any> {
        const requests = [
            this.application.end()
        ];

        for (const customApplication of this.customApplications) {
            requests.push(
                customApplication.end()
            );
        }

        return Promise.all(requests)
            .catch((error) => {
                this.logError(error);
            });
    }

    public cloneInstance<O>(obj: O): TestContext & O {
        const copy: this & O = Object.assign(Object.create(Object.getPrototypeOf(this)), this, obj);
        Object.assign(copy.constructor, this.constructor);

        return copy;
    }
}
