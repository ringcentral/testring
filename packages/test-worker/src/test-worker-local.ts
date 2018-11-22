import * as process from 'process';
import * as path from 'path';
import { EventEmitter } from 'events';
import { Sandbox } from '@testring/sandbox';
import { testAPIController } from '@testring/api';
import { deserialize } from '@testring/transport';
import {
    ITransport,
    ITestExecutionMessage,
    ITestExecutionCompleteMessage,
    TestWorkerAction,
    TestStatus,
    TestEvents,
    ITransportChild,
    ITransportDirectMessage,
} from '@testring/types';

export class TestWorkerLocal extends EventEmitter implements ITransportChild {

    constructor(
        private transportInstance: ITransport,
    ) {
        super();
    }

    public kill() {
        // @TODO make kill functionality
    }

    public send(message: ITransportDirectMessage, callback: (error: Error) => void): boolean {
        const { payload, type } = message;

        if (type === TestWorkerAction.executeTest) {
            this.executeTest(deserialize(payload) as ITestExecutionMessage)
                .then((testResult) => {
                    this.transportInstance.broadcastLocal<ITestExecutionCompleteMessage>(
                        TestWorkerAction.executionComplete,
                        {
                            status: testResult,
                            error: null
                        }
                    );
                })
                .catch((error) => {
                    this.transportInstance.broadcastLocal<ITestExecutionCompleteMessage>(
                        TestWorkerAction.executionComplete,
                        {
                            status: TestStatus.failed,
                            error
                        }
                    );
                });
        }

        return true;
    }

    private async executeTest(message: ITestExecutionMessage): Promise<TestStatus> {
        // TODO pass message.parameters somewhere inside web application
        const testID = path.relative(process.cwd(), message.path);
        const testAPI = testAPIController;

        const sandbox = new Sandbox(message.content, message.path, message.dependencies);
        const bus = testAPI.getBus();

        let isAsync = false;

        testAPI.setEnvironmentParameters(message.envParameters);
        testAPI.setTestParameters(message.parameters);
        testAPI.setTestID(testID);

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

                    Sandbox.clearCache();
                    resolve(TestStatus.done);
                });

                bus.once(TestEvents.failed, (error) => {
                    bus.removeAllListeners(TestEvents.finished);
                    bus.removeAllListeners(TestEvents.failed);

                    Sandbox.clearCache();
                    reject(error);
                });
            });
        }

        Sandbox.clearCache();
        return TestStatus.done;
    }
}


