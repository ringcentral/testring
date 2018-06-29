import {
    ITransport,
    ITestExecutionMessage,
    ITestExecutionCompleteMessage,
    TestWorkerAction,
    TestStatus,
    TestEvents
} from '@testring/types';
import { loggerClientLocal } from '@testring/logger';
import { Sandbox } from '@testring/sandbox';
import { bus } from '@testring/api';

export class WorkerController {

    private status: TestStatus = TestStatus.idle;

    constructor(private transportInstance: ITransport) {
    }

    public init() {
        this.transportInstance.on(TestWorkerAction.executeTest, async (message: ITestExecutionMessage) => {
            if (this.status === TestStatus.pending) {
                loggerClientLocal.debug('Worker already busy with another test!');
                throw new EvalError('Worker already busy with another test!');
            }

            this.status = TestStatus.pending;

            try {
                const testResult = await this.executeTest(message);

                this.transportInstance.broadcast<ITestExecutionCompleteMessage>(TestWorkerAction.executionComplete, {
                    status: testResult,
                    error: null
                });

                this.status = testResult;
            } catch (error) {
                this.transportInstance.broadcast<ITestExecutionCompleteMessage>(TestWorkerAction.executionComplete, {
                    status: TestStatus.failed,
                    error
                });

                this.status = TestStatus.failed;
            }
        });
    }

    private async executeTest(message: ITestExecutionMessage): Promise<TestStatus> {
        let isAsync = false;

        // TODO pass message.parameters somewhere inside webmanager
        const sandbox = new Sandbox(message.source, message.filename);

        bus.once(TestEvents.started, () => isAsync = true);

        try {
            sandbox.execute();
        } catch (e) {
            return Promise.reject(e);
        }


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


