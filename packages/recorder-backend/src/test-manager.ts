import * as path from 'path';
import { TestWriter } from './test-writer';
import { PathComposer } from './path-composer';
import { actionsByRecordingEventTypes } from '@testring/types';
import { RECORDER_ELEMENT_IDENTIFIER } from '@testring/constants';

type TestManagerOptions = {
    manager: string;
};

export class TestManager {
    private readonly manager: string;
    private readonly testWriter: TestWriter;
    private readonly pathComposer: PathComposer;

    constructor({ manager }: TestManagerOptions) {
        this.manager = manager;

        this.testWriter = new TestWriter(path.resolve(__dirname, 'test.js'));
        this.pathComposer = new PathComposer(RECORDER_ELEMENT_IDENTIFIER);
    }

    private getActionLine(action: string, path: string) {
        return `${this.manager}.${action}(${path});`;
    }

    handleAction(actionInfo) {
        const path = this.pathComposer.getPathByAttribute(actionInfo.affectedElementsSummary);
        const action = actionsByRecordingEventTypes[actionInfo.type];
        const line = this.getActionLine(action, path);

        this.testWriter.addLine(line);
    }

    finishTest() {
        this.testWriter.write();
    }
}
