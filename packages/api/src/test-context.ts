import { ITestQueuedTestRunData } from '@testring/types';
import { loggerClient } from '@testring/logger';
import { HttpClient } from '@testring/http-api';
import { transport } from '@testring/transport';
import { WebApplication } from '@testring/web-application';
import { testAPIController } from './test-api-controller';

const LOG_PREFIX = '[logged inside test]';

export class TestContext {

    private lastLoggedBusinessMessage: string | null = null;

    private customApplications: Set<WebApplication> = new Set();

    public http: HttpClient;

    constructor(config: any) {
        this.http = new HttpClient(transport, {
            httpThrottle: config.httpThrottle,
        });
    }

    public get application(): WebApplication {
        const runData = this.getRunData();

        let value = new WebApplication(testAPIController.getTestID(), transport, runData);

        Object.defineProperty(this, 'application', {
            value,
            enumerable: false,
            configurable: true,
            writable: true,
        });

        return value;
    }

    public async logBusiness(message: string) {
        await this.stopLogBusiness();

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

    protected getRunData(): ITestQueuedTestRunData {
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
        const requests = this.application.isStopped() ? [] : [
            this.application.end(),
        ];

        for (const customApplication of this.customApplications) {
            if (!customApplication.isStopped()) {
                requests.push(
                    customApplication.end(),
                );
            }
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
