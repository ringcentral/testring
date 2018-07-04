import { EventEmitter } from 'events';
import { TestEvents } from '@testring/types';
import { TestContext } from './test-context';

export { WebApplication } from '@testring/web-application';

const bus = new EventEmitter();

const run = async (...tests: Array<Function>) => {

    bus.emit(TestEvents.started);

    try {
        for (let test of tests) {
            const context = new TestContext();

            await test.call(context, context);
        }

        bus.emit(TestEvents.finished);
    } catch (e) {
        bus.emit(TestEvents.failed);
    }
};

export { run, bus };
