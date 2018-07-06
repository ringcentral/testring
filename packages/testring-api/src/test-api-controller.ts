import { EventEmitter } from 'events';

class TestAPIController {
    private bus = new EventEmitter();
    private testID: string = '';
    public getBus() {
        return this.bus;
    }

    public setTestID(val: string) {
        this.testID = val;
    }
    public getTestID(): string {
        return this.testID;
    }
}

export const testAPIController = new TestAPIController();
