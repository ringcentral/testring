import { 
    ITransport, 
    ITestExecutionMessage, 
    ITestExecutionCompleteMessage, 
    TestWorkerAction, 
    TestStatus, 
    TestEvents 
} from '@testring/types';
import { Sandbox } from './sandbox';

export class WorkerController {

    private status: TestStatus = TestStatus.idle;

    constructor(private transportInstance: ITransport) {}

    public init() {
        this.transportInstance.on(TestWorkerAction.executeTest, async (message: ITestExecutionMessage) => {
            if (this.status === TestStatus.pending) {
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


