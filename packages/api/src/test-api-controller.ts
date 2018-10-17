import { EventEmitter } from 'events';

export class TestAPIController {
    private bus = new EventEmitter();

    private testID: string = '';

    private testParameters: object = {};

    private httpThrottle: number;

    private environmentParameters: object = {};

    public getBus() {
        return this.bus;
    }

    public setTestID(testID: string) {
        this.testID = testID;
    }

    public getTestID(): string {
        return this.testID;
    }

    public setTestParameters(parameters: object) {
        this.testParameters = parameters;
    }

    public getTestParameters(): object {
        return this.testParameters;
    }

    public setEnvironmentParameters(parameters: object) {
        this.environmentParameters = parameters;
    }

    public getEnvironmentParameters(): object {
        return this.environmentParameters;
    }
    
    public setHttpThrottle(httpThrottle: number): void {
        this.httpThrottle = httpThrottle;
    }

    public getHttpThrottle(): number {
        return this.httpThrottle;
    }

}

export const testAPIController = new TestAPIController();
