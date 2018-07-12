import { EventEmitter } from 'events';

export class TestAPIController {
    private bus = new EventEmitter();

    private testID: string = '';

    private testParameters: object = {};

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
}

export const testAPIController = new TestAPIController();
