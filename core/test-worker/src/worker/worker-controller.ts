import process from 'node:process';
import * as path from 'path';
import {pathToFileURL} from 'node:url';
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
import {restructureError} from '@testring/utils';
import {testAPIController, TestAPIController} from '@testring/api';
import {asyncBreakpoints, BreakStackError} from '@testring/async-breakpoints';
import {loggerClient, LoggerClient} from '@testring/logger';

// TypeScript downlevels a literal `await import(...)` expression to a
// `require()` call under `module: "commonjs"` (this repo's target), which
// cannot load a `file://` URL. Constructing the dynamic import via
// `new Function` keeps the `import()` keyword inside a string until
// runtime, so tsc never sees it to downlevel, and Node evaluates a genuine
// native dynamic import.
const dynamicImport: (specifier: string) => Promise<unknown> = new Function(
    'specifier',
    'return import(specifier);',
) as (specifier: string) => Promise<unknown>;

export class WorkerController {
    private logger: LoggerClient = loggerClient.withPrefix(
        '[worker-controller]',
    );

    private isDevtoolsInitialized = false;

    // Set from each ITestExecutionMessage.workerId as it arrives, so the
    // completion message (built after the fact, with no message of its own
    // to read from) can still attribute the result to the correct worker.
    private currentWorkerId = '';

    // Cache-busts every native `import()` call so a retried/re-evaluated
    // test file always re-executes its top-level code fresh, matching the
    // deleted vm-sandbox's per-execution `clearCache()` behavior — Node's
    // ESM module registry otherwise caches by resolved URL for the lifetime
    // of the process.
    private importCounter = 0;

    private executionState: ITestControllerExecutionState = {
        paused: false,
        pending: false,
        pausedTilNext: false,
    };

    constructor(
        private transport: ITransport,
        private testAPI: TestAPIController,
    ) {}

    public init() {
        this.transport.on(
            TestWorkerAction.executeTest,
            async (message: ITestExecutionMessage) => {
                await this.executeTest(message);
            },
        );
    }

    private updateExecutionState(
        field: keyof ITestControllerExecutionState,
        state: boolean,
    ) {
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

        this.transport.broadcastUniversally(TestWorkerAction.unregister, {});

        this.transport.broadcastUniversally<ITestExecutionCompleteMessage>(
            TestWorkerAction.executionComplete,
            {
                status: TestStatus.done,
                error: null,
                workerId: this.currentWorkerId,
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
        this.logger.error(error, 'Error during test execution');
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
                workerId: this.currentWorkerId,
            },
        );

        this.transport.broadcastUniversally(
            TestWorkerAction.unregister,
            this.executionState,
        );
    }

    public async executeTest(message: ITestExecutionMessage): Promise<void> {
        this.currentWorkerId = message.workerId;

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
                    await this.completeExecutionFailed(error as Error);
                }
            }
        }
    }

    private evaluateCode(message: ITestEvaluationMessage) {
        // Devtool's interactive code-evaluation feature relied entirely on
        // the deleted vm-sandbox's re-runnable execution context. Devtool is
        // an out-of-scope, deprecated module for this migration (see
        // spec.md Clarifications) — there is no native-ESM equivalent
        // context to re-evaluate code in, so this is a no-op rather than a
        // reimplementation.
        this.logger.warn(
            `[worker-controller] devtool code evaluation is not supported: ${message.path}`,
        );
    }

    private async setDevtoolListeners(): Promise<void> {
        if (this.isDevtoolsInitialized) {
            return;
        }

        this.transport.on(
            TestWorkerAction.evaluateCode,
            async (message: ITestEvaluationMessage) => {
                this.evaluateCode(message);
            },
        );

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

        const bus = this.testAPI.getBus();

        this.testAPI.setEnvironmentParameters(message.envParameters);
        this.testAPI.setTestParameters(message.parameters);
        this.testAPI.setTestID(testID);

        // Test becomes async, when run method called
        // In all other cases it's plane sync file execution.
        //
        // NOTE: with the deleted vm-sandbox, `sandbox.execute()` ran a test
        // file's top-level code synchronously, so `started`/`finished`
        // always fired well after this method had already attached its
        // real listeners. Native `import()` genuinely resolves over
        // multiple ticks (real module resolution/IO), so a fast/trivial
        // test's `started`+`finished` pair can now fire *before*
        // `importTestFile()` resolves. Settling via a single idempotent
        // finish/fail pair — reachable from either the import() resolving
        // or a bus event firing, whichever happens first — makes this
        // order-independent instead of relying on listener reassignment
        // happening in time.
        return new Promise<void>((resolve, reject) => {
            let isAsync = false;
            let settled = false;

            const finish = () => {
                if (settled) {
                    return;
                }
                settled = true;
                removeListeners();
                resolve();
            };

            const fail = (error: Error) => {
                if (settled) {
                    return;
                }
                settled = true;
                removeListeners();
                reject(restructureError(error));
            };

            const startHandler = () => {
                isAsync = true;
            };
            const finishHandler = () => finish();
            const failHandler = (error: Error) => fail(error);

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
            this.importTestFile(message.path).then(
                () => {
                    // A synchronous test (no `run()` call) is done as soon
                    // as its top-level code finished executing. An async
                    // test's completion is signalled by finished/failed
                    // instead — which, per the note above, may already
                    // have fired by now.
                    if (!isAsync) {
                        finish();
                    }
                },
                (err) => fail(err as Error),
            );
        });
    }

    // Native replacement for the deleted vm-sandbox: imports the autotest
    // file directly from disk by its real path (via ./esm-loader-hooks,
    // registered at worker startup), so Node's own module resolution
    // builds the dependency graph and reported stack traces point at the
    // exact authored file/line (FR-002) instead of a synthesized context.
    // The cache-busting query string forces a fresh evaluation every call,
    // even for the same path (e.g. a retry), matching the sandbox's
    // per-execution clearCache() behavior.
    private async importTestFile(filePath: string): Promise<void> {
        const moduleUrl = `${pathToFileURL(filePath).href}?testringExecution=${this.importCounter++}`;

        await dynamicImport(moduleUrl);
    }
}
