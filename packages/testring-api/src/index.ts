import { EventEmitter } from 'events';
import { TestEvents } from '@testring/types';
import { TestContent } from './test-content';

const bus = new EventEmitter();

const run = async (...tests: Array<Function>) => {

    bus.emit(TestEvents.started);

    try {
        for (let test of tests) {
            const context = new TestContent();

            await test.call(context);
        }

        bus.emit(TestEvents.finished);
    } catch (e) {
        bus.emit(TestEvents.failed);
    }
};

export { run, bus };
