import * as process from 'process';
import * as path from 'path';

import {
    ITransport,
    ITestEvaluationMessage,
    ITestExecutionMessage,
    ITestExecutionCompleteMessage,
    ITestControllerExecutionState,
    TestWorkerAction,
    TestStatus,
    TestEvents,
} from '@testring/types';
import { restructureError } from '@testring/utils';

import { Sandbox } from '@testring/sandbox';
import { testAPIController, TestAPIController } from '@testring/api';
import { asyncBreakpoints, BreakStackError } from '@testring/async-breakpoints';
import { loggerClient, LoggerClient } from '@testring/logger';

export class WorkerController {

    private logger: LoggerClient = loggerClient.withPrefix('[worker-controller]');

    private isDevtoolsInitialized: boolean = false;

    private executionState: ITestControllerExecutionState = {
        paused: false,
        pending: false,
        pausedTilNext: false,
    };

    constructor(
        private transport: ITransport,
        private testAPI: TestAPIController,
    ) {
    }

    public init() {
        this.transport.on(TestWorkerAction.executeTest, async (message: ITestExecutionMessage) => {
            await this.executeTest(message);
        });
    }

    private updateExecutionState(field: keyof ITestControllerExecutionState, state: boolean) {
        if (this.executionState[field] !== state) {
            this.executionState[field] = state;

            this.transport.broadcastUniversally(
                TestWorkerAction.updateExecutionState,
                this.executionState,
            );
        }
    }

    private setPendingState(state: boolean) {
        this.updateExecutionState('pending', state);
    }

    private setPausedState(state: boolean) {
        this.updateExecutionState('paused', state);
    }

    private setPausedTilNextState(state: boolean) {
        this.updateExecutionState('pausedTilNext', state);
    }

    private activatePauseMode() {
        this.setPausedState(true);
        asyncBreakpoints.addBeforeInstructionBreakpoint();
    }

    private setRunTillNextExecutionMode() {
        this.setPausedState(false);
        if (asyncBreakpoints.isBeforeInstructionBreakpointActive()) {
            asyncBreakpoints.resolveBeforeInstructionBreakpoint();
        }

        this.setPausedTilNextState(true);
        if (asyncBreakpoints.isAfterInstructionBreakpointActive()) {
            asyncBreakpoints.resolveAfterInstructionBreakpoint();
        }

        asyncBreakpoints.addAfterInstructionBreakpoint();
    }

    private releasePauseMode() {
        this.setPausedState(false);
        this.setPausedTilNextState(false);
        asyncBreakpoints.resolveBeforeInstructionBreakpoint();
        asyncBreakpoints.resolveAfterInstructionBreakpoint();
    }


    private async completeExecutionSuccessfully() {
        this.releasePauseMode();

        try {
            await testAPIController.flushAfterRunCallbacks();
        } catch (e) {
            this.logger.error('Failed to release tests execution');
        }
        Sandbox.clearCache();

        this.transport.broadcastUniversally(
            TestWorkerAction.unregister,
            {},
        );

        this.transport.broadcastUniversally<ITestExecutionCompleteMessage>(
            TestWorkerAction.executionComplete,
            {
                status: TestStatus.done,
                error: null,
            },
        );
    }

    private async releaseTestExecution() {
        if (this.executionState.pending) {
            asyncBreakpoints.breakStack();
            await this.completeExecutionSuccessfully();
        } else {
            await this.completeExecutionSuccessfully();
        }
    }

    private async completeExecutionFailed(error: Error) {
        this.releasePauseMode();

        try {
            await testAPIController.flushAfterRunCallbacks();
        } catch (e) {
            this.logger.error('Failed to release tests execution');
        }

        this.transport.broadcastUniversally<ITestExecutionCompleteMessage>(
            TestWorkerAction.executionComplete,
            {
                status: TestStatus.failed,
                error,
            },
        );

        Sandbox.clearCache();

        this.transport.broadcastUniversally(
            TestWorkerAction.unregister,
            this.executionState,
        );
    }

    public async executeTest(message: ITestExecutionMessage): Promise<void> {
        this.transport.broadcastUniversally(
            TestWorkerAction.register,
            this.executionState,
        );

        try {
            if (message.waitForRelease) {
                await this.setDevtoolListeners();
            }

            this.setPendingState(true);
            await this.runTest(message);
            this.setPendingState(false);

            if (!message.waitForRelease) {
                await this.completeExecutionSuccessfully();
            }
        } catch (error) {
            if (!message.waitForRelease) {
                if (error instanceof BreakStackError) {
                    await this.completeExecutionSuccessfully();
                } else {
                    await this.completeExecutionFailed(error);
                }
            }
        }
    }

    private evaluateCode(message: ITestEvaluationMessage) {
        this.setPendingState(true);
        Sandbox.evaluateScript(message.path, message.content)
            .catch((err) => this.logger.error(err));
        this.setPendingState(false);
    }

    private async setDevtoolListeners(): Promise<void> {
        if (this.isDevtoolsInitialized) {
            return;
        }

        this.transport.on(TestWorkerAction.evaluateCode, async (message: ITestEvaluationMessage) => {
            this.evaluateCode(message);
        });

        this.transport.on(TestWorkerAction.releaseTest, async () => {
            this.releaseTestExecution();
        });

        this.transport.on(TestWorkerAction.pauseTestExecution, async () => {
            this.activatePauseMode();
        });

        this.transport.on(TestWorkerAction.runTillNextExecution, async () => {
            this.setRunTillNextExecutionMode();
        });

        this.transport.on(TestWorkerAction.resumeTestExecution, async () => {
            this.releasePauseMode();
        });

        this.isDevtoolsInitialized = true;
    }

    private async runTest(message: ITestExecutionMessage): Promise<void> {
        // TODO (flops) pass message.parameters somewhere inside web application
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
        try {
            await sandbox.execute();
        } catch (err) {
            throw restructureError(err);
        }

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


