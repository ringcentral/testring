import * as path from 'path';
import { TestWriter } from './test-writer';
import { PathComposer } from './path-composer';
import { commandsByRecordingEventTypes } from '@testring/types';
import { RECORDER_ELEMENT_IDENTIFIER } from '@testring/constants';

export class TestManager {
    constructor(
        private manager: string,
        private testWriter = new TestWriter(path.resolve(__dirname, 'test.js')),
        private pathComposer = new PathComposer(RECORDER_ELEMENT_IDENTIFIER),
    ) { }

    private getCommand({ eventType, path, value, text }) {
        return commandsByRecordingEventTypes[eventType]({ manager: this.manager, path, value, text });
    }

    // FIXME add type
    handleEvent(eventInfo) {
        const path = this.pathComposer.getPath(eventInfo.affectedElementsSummary);
        const targetElementSummary = [...eventInfo.affectedElementsSummary].pop();
        const line = this.getCommand({
            path,
            eventType: eventInfo.type,
            value: targetElementSummary.value,
            text: targetElementSummary.innerText,
        });

        this.testWriter.addLine(line);
    }

    finishTest() {
        this.testWriter.write();
    }
}
