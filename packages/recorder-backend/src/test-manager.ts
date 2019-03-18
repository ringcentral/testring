import { EventEmitter } from 'events';
import * as path from 'path';
import { TestWriter } from './test-writer';
import { PathComposer } from './path-composer';
import { commandsByRecordingEventTypes, RecorderEvents } from '@testring/types';
import { RECORDER_ELEMENT_IDENTIFIER } from '@testring/constants';

export class TestManager extends EventEmitter {
    constructor(
        private manager: string,
        private testWriter = new TestWriter(path.resolve(__dirname, 'test.js')),
        private pathComposer = new PathComposer(RECORDER_ELEMENT_IDENTIFIER),
    ) {
        super();
    }

    private getCommand({ eventType, path, value, text }) {
        return commandsByRecordingEventTypes[eventType]({ manager: this.manager, path, value, text });
    }

    // FIXME add type
    handleEvent(eventInfo) {
        let path;

        if (eventInfo.path) {
            path = eventInfo.path;
        } else {
            path = this.pathComposer.getPath(eventInfo.affectedElementsSummary);

            if (path.match(/[0-9]/)) {
                this.emit(RecorderEvents.SPECIFY_PATH, { ...eventInfo, path });

                return;
            }
        }

        const targetElementSummary = [...eventInfo.affectedElementsSummary].pop();
        const line = this.getCommand({
            path,
            eventType: eventInfo.type,
            value: targetElementSummary.value,
            text: targetElementSummary.innerText,
        });

        this.testWriter.addLine(line);
        this.emit(RecorderEvents.EMIT_BROWSER_EVENT, eventInfo);
    }

    finishTest() {
        this.testWriter.write();
    }
}
