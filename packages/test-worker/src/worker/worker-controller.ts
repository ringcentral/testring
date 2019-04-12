import {
    ITransport,
    ITestEvaluationMessage,
    ITestExecutionMessage,
    ITestExecutionCompleteMessage,
    TestWorkerAction,
    TestStatus,
    TestEvents,
} from '@testring/types';

import * as process from 'process';
import * as path from 'path';

import { Sandbox } from '@testring/sandbox';
import { TestAPIController } from '@testring/api';
import { asyncBreakpoints } from '@testring/async-breakpoints';

export class WorkerController {

    constructor(
        private transportInstance: ITransport,
        private testAPI: TestAPIController
    ) {
    }

    public init() {
        this.transportInstance.on(TestWorkerAction.executeTest, async (message: ITestExecutionMessage) => {
            await this.executeTest(message);
        });

        this.transportInstance.on(TestWorkerAction.pauseTestExecution, async () => {
            this.activatePauseMode();
        });
        this.transportInstance.on(TestWorkerAction.runTillNextExecution, async () => {
            this.setRunTillNextExecutionMode();
        });

        this.transportInstance.on(TestWorkerAction.resumeTestExecution, async () => {
            this.releasePauseMode();
        });
    }

    private activatePauseMode() {
        asyncBreakpoints.addBeforeInstructionBreakpoint();
    }

    private setRunTillNextExecutionMode() {
        if (asyncBreakpoints.isAfterInstructionBreakpointActive()) {
            asyncBreakpoints.resolveAfterInstructionBreakpoint();
        }

        asyncBreakpoints.addAfterInstructionBreakpoint();
    }

    private releasePauseMode() {
        asyncBreakpoints.resolveBeforeInstructionBreakpoint();
        asyncBreakpoints.resolveAfterInstructionBreakpoint();
    }


    private waitForRelease() {
        this.transportInstance.on(TestWorkerAction.evaluateCode, async (message: ITestEvaluationMessage) => {
            Sandbox.evaluateScript(message.path, message.content);
        });
        this.transportInstance.on(TestWorkerAction.releaseTest, async () => {
            this.completeExecutionSuccessfully();
        });
    }

    private completeExecutionSuccessfully() {
        this.releasePauseMode();
        Sandbox.clearCache();

        this.transportInstance.broadcastUniversally<ITestExecutionCompleteMessage>(
            TestWorkerAction.executionComplete,
            {
                status: TestStatus.done,
                error: null,
            }
        );
    }

    private completeExecutionFailed(error: Error) {
        this.releasePauseMode();

        this.transportInstance.broadcastUniversally<ITestExecutionCompleteMessage>(
            TestWorkerAction.executionComplete,
            {
                status: TestStatus.failed,
                error,
            }
        );
    }

    public async executeTest(message: ITestExecutionMessage): Promise<void> {
        try {
            await this.runTest(message);

            this.completeExecutionSuccessfully();
        } catch (error) {
            if (message.waitForRelease) {
                this.waitForRelease();
            } else {
                this.completeExecutionFailed(error);
            }
        }
    }

    private async runTest(message: ITestExecutionMessage): Promise<void> {
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

        const removeListeners = () => {
            bus.removeListener(TestEvents.started, startHandler);
            bus.removeListener(TestEvents.finished, finishHandler);
            bus.removeListener(TestEvents.failed, failHandler);
        };

        bus.on(TestEvents.started, startHandler);
        bus.on(TestEvents.finished, finishHandler);
        bus.on(TestEvents.failed, failHandler);

        // Test file execution, should throw exception,
        // if something goes wrong
        await sandbox.execute();

        if (isAsync) {
            return new Promise<void>((resolve, reject) => {
                finishCallback = () => {
                    resolve();
                    removeListeners();
                };
                failCallback = (error) => {
                    reject(error);
                    removeListeners();
                };
            });
        }

        removeListeners();
    }
}


