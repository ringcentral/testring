import * as process from 'process';
import * as path from 'path';
import { Sandbox } from '@testring/sandbox';
import { TestAPIController } from '@testring/api';
import {
    ITransport,
    ITestExecutionMessage,
    ITestExecutionCompleteMessage,
    TestWorkerAction,
    TestStatus,
    TestEvents
} from '@testring/types';

export class WorkerController {

    constructor(
        private transportInstance: ITransport,
        private testAPI: TestAPIController
    ) {
    }

    public init() {
        this.transportInstance.on(TestWorkerAction.executeTest, async (message: ITestExecutionMessage) => {
            try {
                const testResult = await this.executeTest(message);

                this.transportInstance.broadcast<ITestExecutionCompleteMessage>(TestWorkerAction.executionComplete, {
                    status: testResult,
                    error: null
                });
            } catch (error) {
                this.transportInstance.broadcast<ITestExecutionCompleteMessage>(TestWorkerAction.executionComplete, {
                    status: TestStatus.failed,
                    error
                });
            }
        });
    }

    private async executeTest(message: ITestExecutionMessage): Promise<TestStatus> {
        // TODO pass message.parameters somewhere inside web application
        const testID = path.relative(process.cwd(), message.filename);
        const sandbox = new Sandbox(message.source, message.filename);
        const bus = this.testAPI.getBus();

        let isAsync = false;

        this.testAPI.setTestParameters(message.parameters);
        this.testAPI.setTestID(testID);

        // Test becomes async, when run method called
        // In all other cases it's plane sync file execution
        bus.once(TestEvents.started, () => isAsync = true);

        // Test file execution, should throw exception,
        // if something goes wrong
        sandbox.execute();

        if (isAsync) {
            return new Promise<TestStatus>((resolve, reject) => {
                bus.once(TestEvents.finished, () => {
                    bus.removeAllListeners(TestEvents.finished);
                    bus.removeAllListeners(TestEvents.failed);

                    resolve(TestStatus.done);
                });

                bus.once(TestEvents.failed, (error) => {
                    bus.removeAllListeners(TestEvents.finished);
                    bus.removeAllListeners(TestEvents.failed);

                    reject(error);
                });
            });
        }

        return TestStatus.done;
    }
}


