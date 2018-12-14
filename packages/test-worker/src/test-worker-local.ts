import { EventEmitter } from 'events';
import { testAPIController } from '@testring/api';
import { WorkerController } from './worker/worker-controller';
import {
    ITransport,
    ITestExecutionMessage,
    ITestExecutionCompleteMessage,
    TestWorkerAction,
    TestStatus,
    IWorkerEmitter,
    ITransportDirectMessage,
} from '@testring/types';

export class TestWorkerLocal extends EventEmitter implements IWorkerEmitter {

    private workerController: WorkerController;

    constructor(
        private transportInstance: ITransport,
    ) {
        super();

        this.workerController = new WorkerController(this.transportInstance, testAPIController);
    }

    public kill() {
        this.emit('exit');
    }

    public send(message: ITransportDirectMessage, callback: (error: Error) => void): boolean {
        const { payload, type } = message;

        if (type === TestWorkerAction.executeTest) {
            this.executeTest(payload);
        }

        return true;
    }

    private executeTest(payload) {
        this.workerController.executeTest(payload as ITestExecutionMessage)
            .then((testResult) => {
                this.transportInstance.broadcastUniversally<ITestExecutionCompleteMessage>(
                    TestWorkerAction.executionComplete,
                    {
                        status: testResult,
                        error: null,
                    }
                );
            })
            .catch((error) => {
                this.transportInstance.broadcastUniversally<ITestExecutionCompleteMessage>(
                    TestWorkerAction.executionComplete,
                    {
                        status: TestStatus.failed,
                        error,
                    }
                );
            });
    }
}


