import * as path from 'path';
import { TestWriter } from './test-writer';
import { actionsByRecordingEventTypes } from '@testring/types';

type TestManagerOptions = {
    manager: string;
};

export class TestManager {
    manager: string;
    testWriter: TestWriter;

    constructor({ manager }: TestManagerOptions) {
        this.manager = manager;

        this.testWriter = new TestWriter(path.resolve(__dirname, 'test.js'));
    }

    getActionLine(action: string, path: string) {
        return `${this.manager}.${action}(${path});`;
    }

    handleAction(actionInfo) {
        const path = 'root.abc.abc';
        const action = actionsByRecordingEventTypes[actionInfo.type];
        const line = this.getActionLine(action, path);

        this.testWriter.addLine(line);
    }

    finishTest() {
        this.testWriter.write();
    }
}
