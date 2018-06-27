import { Transport } from '@testring/transport';
import { IExecutionMessage, IExecutionCompleteMessage } from '../../interfaces';
import { WorkerAction, TestStatus, TestEvents } from '../constants';
import { Sandbox } from './sandbox';
import { loggerClientLocal } from '@testring/logger';

export class WorkerController {

    private status: TestStatus = TestStatus.idle;

    constructor(private transportInstance: Transport) {
    }

    public init() {
        this.transportInstance.on(WorkerAction.executeTest, async (message: IExecutionMessage) => {
            if (this.status === TestStatus.pending) {
                loggerClientLocal.debug('Worker already busy with another test!');
                throw new EvalError('Worker already busy with another test!');
            }

            this.status = TestStatus.pending;

            try {
                const testResult = await this.executeTest(message);

                this.transportInstance.broadcast<IExecutionCompleteMessage>(WorkerAction.executionComplete, {
                    status: testResult,
                    error: null
                });

                this.status = testResult;
            } catch (error) {
                this.transportInstance.broadcast<IExecutionCompleteMessage>(WorkerAction.executionComplete, {
                    status: TestStatus.failed,
                    error
                });

                this.status = TestStatus.failed;
            }
        });
    }

    private async executeTest(message: IExecutionMessage): Promise<TestStatus> {
        let isAsync = false;

        // TODO pass message.parameters somewhere inside webmanager
        const sandbox = new Sandbox(message.source, message.filename);
        const sandboxTransport = sandbox.getTransport();

        sandboxTransport.once(TestEvents.started, () => isAsync = true);

        try {
            sandbox.execute();
        } catch (e) {
            return Promise.reject(e);
        }


        if (isAsync) {
            return new Promise<TestStatus>((resolve, reject) => {
                sandboxTransport.once(TestEvents.finished, () => {
                    resolve(TestStatus.done);
                });
                sandboxTransport.once(TestEvents.failed, (error) => {
                    reject(error);
                });
            });
        }

        return TestStatus.done;
    }
}


