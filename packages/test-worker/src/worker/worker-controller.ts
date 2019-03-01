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
    TestEvents,
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

                this.transportInstance.broadcastUniversally<ITestExecutionCompleteMessage>(
                    TestWorkerAction.executionComplete,
                    {
                        status: testResult,
                        error: null,
                    }
                );
            } catch (error) {
                this.transportInstance.broadcastUniversally<ITestExecutionCompleteMessage>(
                    TestWorkerAction.executionComplete,
                    {
                        status: TestStatus.failed,
                        error,
                    }
                );
            }
        });
    }

    public async executeTest(message: ITestExecutionMessage): Promise<TestStatus> {
        // TODO pass message.parameters somewhere inside web application
        const testID = path.relative(process.cwd(), message.path);

        const sandbox = new Sandbox(message.content, message.path, message.dependencies);
        const bus = this.testAPI.getBus();

        this.testAPI.setEnvironmentParameters(message.envParameters);
        this.testAPI.setTestParameters(message.parameters);
        this.testAPI.setTestID(testID);

        // Test becomes async, when run method called
        // In all other cases it's plane sync file execution
        let isAsync = false;

        let finishCallback = () => {};
        let failCallback = (error: Error) => {};

        const startHandler = () => isAsync = true;
        const finishHandler = () => finishCallback();
        const failHandler = (error) => failCallback(error);
        const clearExecution = () => {
            Sandbox.clearCache();
            bus.removeListener(TestEvents.started, startHandler);
            bus.removeListener(TestEvents.finished, finishHandler);
            bus.removeListener(TestEvents.failed, failHandler);
        };

        bus.on(TestEvents.started, startHandler);
        bus.on(TestEvents.finished, finishHandler);
        bus.on(TestEvents.failed, failHandler);

        // Test file execution, should throw exception,
        // if something goes wrong
        sandbox.execute();

        if (isAsync) {
            return new Promise<TestStatus>((resolve, reject) => {
                finishCallback = () => {
                    resolve(TestStatus.done);
                    clearExecution();
                };
                failCallback = (error) => {
                    reject(error);
                    clearExecution();
                };
            });
        }

        clearExecution();
        return TestStatus.done;
    }
}


