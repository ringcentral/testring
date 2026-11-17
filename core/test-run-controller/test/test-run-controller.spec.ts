/// <reference types="mocha" />
/* eslint sonarjs/no-identical-functions: 0 */

import * as chai from 'chai';
import {TestWorkerMock} from '@testring/test-utils';
import {IFile, ITestWorker, ITestWorkerInstance} from '@testring/types';
import {TestRunControllerPlugins} from '@testring/types/src/test-run-controller';
import {TestRunController} from '../src/test-run-controller';

const DEFAULT_TIMEOUT = 60 * 1000;

const generateTestFile = (index: number) => ({
    path: `qwerty-${index}.js`,
    content: `console.log(${index})`,
    meta: {},
});

const generateTestFiles = (count: number) =>
    Array.from({length: count}, (_v, i) => generateTestFile(i));

const testDelay = (milliseconds: number) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));

type ShouldFailAttempt = (path: string, attempt: number) => boolean;
type AttemptDelay = (path: string, attempt: number) => number;

interface IRecordingTestWorkerOptions {
    executionDelay?: number | AttemptDelay;
    shouldHangAttempt?: ShouldFailAttempt;
    shouldFailAttempt?: ShouldFailAttempt;
    shouldFailKill?: (workerID: string, signal?: NodeJS.Signals) => boolean;
}

class RecordingTestWorkerState {
    public killCalls = 0;

    public maxTotalActive = 0;

    public readonly attemptsByPath = new Map<string, number>();

    public readonly retryFlagsByPath = new Map<string, boolean[]>();

    public readonly maxActiveByPath = new Map<string, number>();

    public readonly errors: Error[] = [];

    public readonly replacements: Array<{
        previousWorkerID: string;
        replacementWorkerID: string;
    }> = [];

    public shouldFailKill(workerID: string, signal?: NodeJS.Signals): boolean {
        return !!this.options.shouldFailKill?.(workerID, signal);
    }

    private totalActive = 0;

    private readonly activeByPath = new Map<string, number>();

    private readonly options: IRecordingTestWorkerOptions;

    constructor(options: IRecordingTestWorkerOptions = {}) {
        this.options = options;
    }

    public async execute(file: IFile, parameters: any): Promise<void> {
        const attempt = this.attemptsByPath.get(file.path) || 0;
        this.attemptsByPath.set(file.path, attempt + 1);
        this.storeRetryFlag(file.path, !!parameters.runData?.isRetryRun);
        this.start(file.path);

        try {
            if (this.options.shouldHangAttempt?.(file.path, attempt)) {
                await new Promise(() => undefined);
            }

            const executionDelay =
                typeof this.options.executionDelay === 'function'
                    ? this.options.executionDelay(file.path, attempt)
                    : this.options.executionDelay;

            if (executionDelay) {
                await testDelay(executionDelay);
            }

            if (this.options.shouldFailAttempt?.(file.path, attempt)) {
                const error = new Error(
                    `Test ${file.path} failed on attempt ${attempt}`,
                );
                this.errors.push(error);
                throw error;
            }
        } finally {
            this.finish(file.path);
        }
    }

    private storeRetryFlag(path: string, isRetryRun: boolean): void {
        const retryFlags = this.retryFlagsByPath.get(path) || [];
        retryFlags.push(isRetryRun);
        this.retryFlagsByPath.set(path, retryFlags);
    }

    private start(path: string): void {
        const pathActive = (this.activeByPath.get(path) || 0) + 1;
        this.activeByPath.set(path, pathActive);
        this.maxActiveByPath.set(
            path,
            Math.max(this.maxActiveByPath.get(path) || 0, pathActive),
        );

        this.totalActive++;
        this.maxTotalActive = Math.max(
            this.maxTotalActive,
            this.totalActive,
        );
    }

    private finish(path: string): void {
        this.activeByPath.set(path, (this.activeByPath.get(path) || 1) - 1);
        this.totalActive--;
    }
}

class RecordingTestWorkerInstance implements ITestWorkerInstance {
    private readonly state: RecordingTestWorkerState;

    private workerID: string;

    private replacementCount = 0;

    constructor(
        state: RecordingTestWorkerState,
        workerID: string,
    ) {
        this.state = state;
        this.workerID = workerID;
    }

    public getWorkerID(): string {
        return this.workerID;
    }

    public execute(
        file: IFile,
        parameters: any,
        _envParameters: any,
    ): Promise<void> {
        return this.state.execute(file, parameters);
    }

    public async kill(signal?: NodeJS.Signals): Promise<void> {
        this.state.killCalls++;

        if (this.state.shouldFailKill(this.workerID, signal)) {
            throw new Error(`Failed to terminate ${this.workerID}`);
        }

        if (signal === 'SIGABRT') {
            const previousWorkerID = this.workerID;
            this.replacementCount++;
            this.workerID = `${previousWorkerID}/replacement-${this.replacementCount}`;
            this.state.replacements.push({
                previousWorkerID,
                replacementWorkerID: this.workerID,
            });
        }
    }
}

class RecordingTestWorker implements ITestWorker {
    public readonly state: RecordingTestWorkerState;

    private spawnedCount = 0;

    constructor(options: IRecordingTestWorkerOptions = {}) {
        this.state = new RecordingTestWorkerState(options);
    }

    public spawn(): ITestWorkerInstance {
        this.spawnedCount++;

        return new RecordingTestWorkerInstance(
            this.state,
            `worker/${this.spawnedCount}`,
        );
    }

    public getAttemptCount(path: string): number {
        return this.state.attemptsByPath.get(path) || 0;
    }

    public getRetryFlags(path: string): boolean[] {
        return this.state.retryFlagsByPath.get(path) || [];
    }

    public getMaxActiveByPath(path: string): number {
        return this.state.maxActiveByPath.get(path) || 0;
    }

    public getTotalAttemptCount(): number {
        return [...this.state.attemptsByPath.values()].reduce(
            (sum, count) => sum + count,
            0,
        );
    }
}

const captureControllerLogs = (testRunController: TestRunController) => {
    const events: Array<{level: string; event: string; fields?: any}> = [];
    const logger = Object.fromEntries(
        ['debug', 'info', 'warn', 'error'].map((level) => [
            level,
            (event: string, fields?: any) =>
                events.push({level, event, fields}),
        ]),
    );

    (testRunController as any).logger = logger;

    return events;
};

describe('TestRunController', () => {
    it('should await and retain every public shutdown failure', async () => {
        const controller = new TestRunController({} as any, {} as any);
        const errors = [new Error('first kill'), new Error('second kill')];
        let killCalls = 0;
        (controller as any).workers = errors.map((error, index) => ({
            getWorkerID: () => `worker/${index}`,
            execute: () => Promise.resolve(),
            kill: async () => {
                killCalls++;
                throw error;
            },
        }));

        const [result] = await Promise.allSettled([controller.kill()]);

        chai.expect(killCalls).to.equal(2);
        chai.expect(result?.status).to.equal('rejected');
        chai.expect((result as PromiseRejectedResult).reason).to.equal(errors[0]);
        chai.expect(
            (result as PromiseRejectedResult).reason.terminationErrors,
        ).to.deep.equal(errors);
    });

    it('should fail if zero workers are passed', async () => {
        const workerLimit = 0;
        const config = {
            bail: false,
            workerLimit,
            timeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(10);

        const testWorkerMock = new TestWorkerMock();
        const testRunController = new TestRunController(config, testWorkerMock);

        const errors = (await testRunController.runQueue(tests)) as Error[];

        chai.expect(errors).to.be.lengthOf(1);
        chai.expect(errors[0]).to.be.instanceOf(Error);

        chai.expect(testWorkerMock.$getSpawnedCount()).to.be.equal(workerLimit);
    });

    it('should run spawn workers with count from according limit', async () => {
        const workerLimit = 20;
        const config = {
            bail: false,
            workerLimit,
            timeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(40);

        const testWorkerMock = new TestWorkerMock(false, 100);
        const testRunController = new TestRunController(config, testWorkerMock);

        await testRunController.runQueue(tests);

        chai.expect(testWorkerMock.$getSpawnedCount()).to.be.equal(workerLimit);
    });

    it('should run only one local worker', async () => {
        const config = {
            bail: false,
            workerLimit: 'local',
            timeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(10);

        const testWorkerMock = new TestWorkerMock();
        const testRunController = new TestRunController(config, testWorkerMock);

        await testRunController.runQueue(tests);

        chai.expect(testWorkerMock.$getSpawnedCount()).to.be.equal(1);
    });

    it('should run all test in one local worker', async () => {
        const testsFiledCount = 10;
        const config = {
            bail: false,
            workerLimit: 'local',
            timeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(testsFiledCount);

        const testWorkerMock = new TestWorkerMock(true);
        const testRunController = new TestRunController(config, testWorkerMock);

        const errors = (await testRunController.runQueue(tests)) as Error[];

        chai.expect(errors).to.be.lengthOf(testsFiledCount);
        chai.expect(testWorkerMock.$getSpawnedCount()).to.be.equal(1);
    });

    it('should run spawn workers by test count, if limit is higher', async () => {
        const testsCount = 2;
        const config = {
            bail: false,
            workerLimit: 10,
            timeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock();
        const testRunController = new TestRunController(config, testWorkerMock);

        await testRunController.runQueue(tests);

        chai.expect(testWorkerMock.$getSpawnedCount()).to.be.equal(testsCount);
    });

    it('should fail instantly, if bail flag passed', async () => {
        const config = {
            bail: true,
            workerLimit: 2,
            timeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(2);

        const testWorkerMock = new TestWorkerMock(true);
        const testRunController = new TestRunController(config, testWorkerMock);

        const errors = await testRunController.runQueue(tests);

        chai.expect(errors).to.be.lengthOf(config.workerLimit);
    });

    it('should run spawn workers according the limit and kill them in the end of the run', async () => {
        const workerLimit = 20;
        const testsCount = 40;
        const config = {
            bail: false,
            workerLimit,
            timeout: DEFAULT_TIMEOUT,
            restartWorker: false,
        } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock();
        const testRunController = new TestRunController(config, testWorkerMock);

        await testRunController.runQueue(tests);

        chai.expect(testWorkerMock.$getSpawnedCount()).to.be.equal(workerLimit);
        chai.expect(testWorkerMock.$getKillCallsCount()).to.be.equal(
            workerLimit,
        );
    });

    it('should run spawn workers according the limit and called kill in the middle', async () => {
        const workerLimit = 2;
        const testsCount = 4;
        const config = {
            bail: false,
            workerLimit,
            timeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock(false, 500);
        const testRunController = new TestRunController(config, testWorkerMock);
        const events = captureControllerLogs(testRunController);

        const runQueue = testRunController.runQueue(tests);

        // Starting a race with execution workers and kill command
        await new Promise<void>((resolve) =>
            setTimeout(() => {
                testRunController.kill();
                resolve();
            }, 100),
        );

        chai.expect(testWorkerMock.$getSpawnedCount()).to.be.equal(workerLimit);
        chai.expect(testWorkerMock.$getKillCallsCount()).to.be.equal(
            workerLimit,
        );

        await runQueue;

        chai.expect(testWorkerMock.$getSpawnedCount()).to.be.equal(workerLimit);
        // Total count is worker limit + in the end of run we killing all worker instances just for sure
        chai.expect(testWorkerMock.$getKillCallsCount()).to.be.equal(
            workerLimit * 2,
        );
        chai.expect(events.at(-1)?.fields).to.include({
            outcome: 'BAILED',
            activeWorkers: 0,
            queueRemaining: 0,
            stopReason: 'cancelled',
        });
    });

    it('should run spawn workers and kill by testTimeout delay', async () => {
        const workerLimit = 1;
        const testsCount = 2;
        const config = {
            bail: false,
            workerLimit,
            timeout: DEFAULT_TIMEOUT,
            testTimeout: 100,
        } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock(false, 1000);
        const testRunController = new TestRunController(config, testWorkerMock);

        const delayErrors = (await testRunController.runQueue(
            tests,
        )) as Error[];

        chai.expect(testWorkerMock.$getSpawnedCount()).to.be.equal(workerLimit);
        chai.expect(testWorkerMock.$getKillCallsCount()).to.be.equal(
            workerLimit + testsCount,
        );

        chai.expect(delayErrors).to.be.lengthOf(testsCount);
    });

    it('should run spawn workers according the limit and kill after every execution', async () => {
        const workerLimit = 20;
        const testsCount = 40;
        const config = {
            bail: false,
            workerLimit,
            timeout: DEFAULT_TIMEOUT,
            restartWorker: true,
        } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock();
        const testRunController = new TestRunController(config, testWorkerMock);

        await testRunController.runQueue(tests);

        chai.expect(testWorkerMock.$getSpawnedCount()).to.be.equal(workerLimit);

        // kill calls is counted by number executions + total workers killed in the end of run
        chai.expect(testWorkerMock.$getKillCallsCount()).to.be.equal(
            testsCount + workerLimit,
        );
    });

    it('should recycle a worker after every N executions when restartWorker is a threshold > 1 (FR-014)', async () => {
        const workerLimit = 1;
        const restartWorker = 4;
        const testsCount = 12;
        const config = {
            bail: false,
            workerLimit,
            timeout: DEFAULT_TIMEOUT,
            restartWorker,
        } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock();
        const testRunController = new TestRunController(config, testWorkerMock);

        await testRunController.runQueue(tests);

        chai.expect(testWorkerMock.$getSpawnedCount()).to.be.equal(workerLimit);

        // Recycled after every 4th execution (3 times over 12 tests), plus
        // the final kill() at the end of the run.
        chai.expect(testWorkerMock.$getKillCallsCount()).to.be.equal(
            testsCount / restartWorker + workerLimit,
        );
    });

    it("should treat restartWorker: 1 the same as restartWorker: true/'always' (FR-014)", async () => {
        const workerLimit = 5;
        const testsCount = 10;
        const config = {
            bail: false,
            workerLimit,
            timeout: DEFAULT_TIMEOUT,
            restartWorker: 1,
        } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock();
        const testRunController = new TestRunController(config, testWorkerMock);

        await testRunController.runQueue(tests);

        chai.expect(testWorkerMock.$getKillCallsCount()).to.be.equal(
            testsCount + workerLimit,
        );
    });

    it('should treat restartWorker: 0 the same as restartWorker: 1 (FR-014)', async () => {
        const workerLimit = 5;
        const testsCount = 10;
        const config = {
            bail: false,
            workerLimit,
            timeout: DEFAULT_TIMEOUT,
            restartWorker: 0,
        } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock();
        const testRunController = new TestRunController(config, testWorkerMock);

        await testRunController.runQueue(tests);

        chai.expect(testWorkerMock.$getKillCallsCount()).to.be.equal(
            testsCount + workerLimit,
        );
    });

    it('should use retries when test fails', async () => {
        const testsCount = 3;
        const retriesCount = 5;
        const config = {
            workerLimit: 2,
            retryDelay: 0,
            retryCount: retriesCount,
            testTimeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock(true);
        const testRunController = new TestRunController(config, testWorkerMock);

        const errors = await testRunController.runQueue(tests);

        const executionCalls = testWorkerMock.$getExecutionCallsCount();

        // Errors are generated only when last retry has failed
        chai.expect(errors).to.be.lengthOf(testsCount);

        // Runner must try to run all failed test with given retries number
        chai.expect(executionCalls).to.be.equal(
            testsCount + testsCount * retriesCount,
        );
    });

    it('should force every passing test to run requested count of attempts', async () => {
        const forceRetryCount = 3;
        const config = {
            workerLimit: 2,
            retryDelay: 0,
            retryCount: 0,
            forceRetryCount,
            testTimeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(2);
        const testWorkerMock = new RecordingTestWorker();
        const testRunController = new TestRunController(config, testWorkerMock);

        const errors = await testRunController.runQueue(tests);

        chai.expect(errors).to.be.equal(null);
        tests.forEach((test) => {
            chai.expect(testWorkerMock.getAttemptCount(test.path)).to.equal(
                forceRetryCount,
            );
            chai.expect(testWorkerMock.getRetryFlags(test.path)).to.deep.equal([
                false,
                true,
                true,
            ]);
        });
    });

    it('should force every failing test to run requested count of attempts and return all failures', async () => {
        const forceRetryCount = 3;
        const config = {
            workerLimit: 2,
            retryDelay: 0,
            retryCount: 0,
            forceRetryCount,
            testTimeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(2);
        const testWorkerMock = new RecordingTestWorker({
            shouldFailAttempt: () => true,
        });
        const testRunController = new TestRunController(config, testWorkerMock);

        const errors = (await testRunController.runQueue(tests)) as Error[];

        chai.expect(errors).to.be.lengthOf(tests.length * forceRetryCount);
        chai.expect(errors).to.have.members(testWorkerMock.state.errors);
        tests.forEach((test) => {
            chai.expect(testWorkerMock.getAttemptCount(test.path)).to.equal(
                forceRetryCount,
            );
        });
    });

    it('should not overlap forced attempts for the same test', async () => {
        const forceRetryCount = 3;
        const config = {
            workerLimit: 3,
            retryDelay: 0,
            retryCount: 0,
            forceRetryCount,
            testTimeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(2);
        const testWorkerMock = new RecordingTestWorker({
            executionDelay: 20,
        });
        const testRunController = new TestRunController(config, testWorkerMock);

        await testRunController.runQueue(tests);

        tests.forEach((test) => {
            chai.expect(testWorkerMock.getMaxActiveByPath(test.path)).to.equal(
                1,
            );
            chai.expect(testWorkerMock.getAttemptCount(test.path)).to.equal(
                forceRetryCount,
            );
        });
    });

    it('should allow different forced tests to overlap up to worker limit', async () => {
        const config = {
            workerLimit: 2,
            retryDelay: 0,
            retryCount: 0,
            forceRetryCount: 2,
            testTimeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(2);
        const testWorkerMock = new RecordingTestWorker({
            executionDelay: 20,
        });
        const testRunController = new TestRunController(config, testWorkerMock);

        await testRunController.runQueue(tests);

        chai.expect(testWorkerMock.state.maxTotalActive).to.equal(2);
    });

    it('should ignore configured retry count in force retry mode', async () => {
        const forceRetryCount = 2;
        const config = {
            workerLimit: 1,
            retryDelay: 0,
            retryCount: 5,
            forceRetryCount,
            testTimeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(1);
        const testWorkerMock = new RecordingTestWorker({
            shouldFailAttempt: () => true,
        });
        const testRunController = new TestRunController(config, testWorkerMock);

        const errors = (await testRunController.runQueue(tests)) as Error[];

        chai.expect(testWorkerMock.getTotalAttemptCount()).to.equal(
            forceRetryCount,
        );
        chai.expect(errors).to.be.lengthOf(forceRetryCount);
    });

    it('should preserve existing retry behavior when force retry count is zero', async () => {
        const retryCount = 2;
        const config = {
            workerLimit: 1,
            retryDelay: 0,
            retryCount,
            forceRetryCount: 0,
            testTimeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(1);
        const testWorkerMock = new RecordingTestWorker({
            shouldFailAttempt: () => true,
        });
        const testRunController = new TestRunController(config, testWorkerMock);

        const errors = (await testRunController.runQueue(tests)) as Error[];

        chai.expect(testWorkerMock.getTotalAttemptCount()).to.equal(
            retryCount + 1,
        );
        chai.expect(errors).to.be.lengthOf(1);
    });

    it('should not use retries when test fails', async () => {
        const testsCount = 3;
        const retriesCount = 5;
        const config = {
            workerLimit: 2,
            retryDelay: 0,
            retryCount: retriesCount,
            testTimeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock(true);
        const testRunController = new TestRunController(config, testWorkerMock);
        const shouldNotRetry = testRunController.getHook(
            TestRunControllerPlugins.shouldNotRetry,
        );

        if (shouldNotRetry) {
            shouldNotRetry.writeHook(
                'testPlugin',
                (state: boolean, _queueItem: unknown, {processID}: {processID: string | number}) => {
                    chai.expect(processID).to.be.equal(
                        testWorkerMock.$getInstanceName(),
                    );
                    chai.expect(state).to.be.equal(false);
                    return true;
                },
            );
        }

        const errors = await testRunController.runQueue(tests);

        const executionCalls = testWorkerMock.$getExecutionCallsCount();

        // Errors are generated only when last retry has failed
        chai.expect(errors).to.be.lengthOf(testsCount);

        // Runner must not try to retry tests run
        chai.expect(executionCalls).to.be.equal(testsCount);
    });

    it('should not start tests execution', async () => {
        const testsCount = 3;
        const retriesCount = 5;
        const config = {
            workerLimit: 2,
            retryDelay: 0,
            retryCount: retriesCount,
            testTimeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock(true);
        const testRunController = new TestRunController(config, testWorkerMock);
        const shouldNotStart = testRunController.getHook(
            TestRunControllerPlugins.shouldNotExecute,
        );

        if (shouldNotStart) {
            shouldNotStart.writeHook('testPlugin', (state: boolean) => {
                chai.expect(state).to.be.equal(false);
                return true;
            });
        }

        const errors = await testRunController.runQueue(tests);

        const executionCalls = testWorkerMock.$getExecutionCallsCount();

        // There should not ba any errors
        chai.expect(errors).to.be.equal(null);

        // Runner must not try to retry tests run
        chai.expect(executionCalls).to.be.equal(0);
    });

    it('should not start tests', async () => {
        const testsCount = 3;
        const retriesCount = 5;
        const config = {
            workerLimit: 2,
            retryDelay: 0,
            retryCount: retriesCount,
            testTimeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock(true);
        const testRunController = new TestRunController(config, testWorkerMock);
        const shouldNotStart = testRunController.getHook(
            TestRunControllerPlugins.shouldNotStart,
        );

        if (shouldNotStart) {
            shouldNotStart.writeHook(
                'testPlugin',
                (state: boolean, _queueItem: unknown, {processID}: {processID: string | number}) => {
                    chai.expect(processID).to.be.equal(
                        testWorkerMock.$getInstanceName(),
                    );
                    chai.expect(state).to.be.equal(false);
                    return true;
                },
            );
        }

        const errors = await testRunController.runQueue(tests);

        const executionCalls = testWorkerMock.$getExecutionCallsCount();

        // There should not ba any errors
        chai.expect(errors).to.be.equal(null);

        // Runner must not try to retry tests run
        chai.expect(executionCalls).to.be.equal(0);
    });

    it('should be matching processID meta', async () => {
        const config = {
            bail: true,
            workerLimit: 2,
            timeout: DEFAULT_TIMEOUT,
        } as any;
        const tests = generateTestFiles(2);

        const testWorkerMock = new TestWorkerMock();
        const testRunController = new TestRunController(config, testWorkerMock);
        const beforeTest = testRunController.getHook(
            TestRunControllerPlugins.beforeTest,
        );
        const afterTest = testRunController.getHook(
            TestRunControllerPlugins.afterTest,
        );

        if (beforeTest && afterTest) {
            beforeTest.readHook('testPlugin', (_entry: unknown, {processID}: {processID: string | number}) => {
                chai.expect(processID).to.be.equal(
                    testWorkerMock.$getInstanceName(),
                );
            });

            afterTest.writeHook('testPlugin', (_entry: unknown, _error: Error | null, {processID}: {processID: string | number}) => {
                chai.expect(processID).to.be.equal(
                    testWorkerMock.$getInstanceName(),
                );
            });
        }

        const errors = await testRunController.runQueue(tests);
        if (errors && errors.length > 0) {
            throw errors[0];
        }
        chai.expect(errors).to.be.equal(null);
    });

    it('should throw an error processID meta afterTest hook', async () => {
        const testsCount = 1;
        const config = {
            bail: true,
            workerLimit: testsCount,
            timeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock(true);
        const testRunController = new TestRunController(config, testWorkerMock);
        const beforeTest = testRunController.getHook(
            TestRunControllerPlugins.beforeTest,
        );
        const afterTest = testRunController.getHook(
            TestRunControllerPlugins.afterTest,
        );

        if (beforeTest && afterTest) {
            beforeTest.readHook('testPlugin', (_entry: unknown, {processID}: {processID: string | number}) => {
                chai.expect(processID).to.be.equal(
                    testWorkerMock.$getInstanceName(),
                );
            });

            afterTest.writeHook('testPlugin', (_entry: unknown, error: Error | null, {processID}: {processID: string | number}) => {
                chai.expect(processID).to.be.equal(
                    testWorkerMock.$getInstanceName(),
                );
                chai.expect(error).to.be.deep.equal(
                    testWorkerMock.$getErrorInstance(),
                );
            });
        }

        const errors = (await testRunController.runQueue(tests)) as Error[];
        chai.expect(errors).to.be.lengthOf(testsCount);
        chai.expect(errors[0]).to.be.deep.equal(
            testWorkerMock.$getErrorInstance(),
        );
    });

    it('should retire only a worker whose timeout termination fails', async () => {
        const tests = generateTestFiles(2);
        const testWorker = new RecordingTestWorker({
            shouldHangAttempt: (path, attempt) =>
                path === tests[0]?.path && attempt === 0,
            shouldFailKill: (workerID, signal) =>
                workerID === 'worker/1' && signal === 'SIGABRT',
        });
        const controller = new TestRunController(
            {
                bail: false,
                workerLimit: 2,
                retryCount: 1,
                testTimeout: 10,
            } as any,
            testWorker,
        );

        const errors = (await controller.runQueue(tests)) as Error[];

        chai.expect(testWorker.getAttemptCount(tests[0]?.path || '')).to.equal(2);
        chai.expect(testWorker.getAttemptCount(tests[1]?.path || '')).to.equal(1);
        chai.expect(errors.map(({message}) => message)).to.deep.equal([
            'Failed to terminate worker/1',
        ]);
    });

    it('should preserve bail after timeout termination failure while settling active siblings', async () => {
        const tests = generateTestFiles(3);
        const testWorker = new RecordingTestWorker({
            executionDelay: 30,
            shouldHangAttempt: (path) => path === tests[0]?.path,
            shouldFailKill: (workerID, signal) =>
                workerID === 'worker/1' && signal === 'SIGABRT',
        });
        const controller = new TestRunController(
            {
                bail: true,
                workerLimit: 2,
                retryCount: 2,
                testTimeout: 10,
            } as any,
            testWorker,
        );

        const errors = (await controller.runQueue(tests)) as Error[];

        chai.expect(testWorker.getTotalAttemptCount()).to.equal(2);
        chai.expect(errors.map(({message}) => message)).to.include.members([
            'Failed to terminate worker/1',
            'Test timeout exceeded 10ms',
        ]);
    });

    it('should retire a worker after recycle termination failure and finish queued work on its sibling', async () => {
        const tests = generateTestFiles(4);
        const testWorker = new RecordingTestWorker({
            executionDelay: 2,
            shouldFailKill: (workerID, signal) =>
                workerID === 'worker/1' && signal === undefined,
        });
        const controller = new TestRunController(
            {
                bail: false,
                workerLimit: 2,
                restartWorker: true,
                testTimeout: DEFAULT_TIMEOUT,
            } as any,
            testWorker,
        );

        const errors = (await controller.runQueue(tests)) as Error[];

        chai.expect(testWorker.getTotalAttemptCount()).to.equal(tests.length);
        chai.expect(errors.map(({message}) => message)).to.deep.equal([
            'Failed to terminate worker/1',
        ]);
    });

    it('timeout preserves attempt identity and settles all work before the summary', async () => {
        const config = {
            bail: false,
            workerLimit: 2,
            retryCount: 1,
            retryDelay: 0,
            testTimeout: 20,
        } as any;
        const tests = generateTestFiles(3);
        const testWorker = new RecordingTestWorker({
            executionDelay: (path) => (path === tests[1]?.path ? 15 : 0),
            shouldHangAttempt: (path, attempt) =>
                path === tests[0]?.path && attempt === 0,
        });
        const controller = new TestRunController(config, testWorker);
        const events = captureControllerLogs(controller);
        const hookEvents: Array<{hook: string; path?: string; processID?: string}> = [];

        controller
            .getHook(TestRunControllerPlugins.beforeTest)
            ?.readHook('identity', (item: any, meta: any) => {
                hookEvents.push({
                    hook: 'beforeTest',
                    path: item.test.path,
                    processID: meta.processID,
                });
            });
        controller
            .getHook(TestRunControllerPlugins.shouldNotRetry)
            ?.readHook('identity', (_state: boolean, item: any, meta: any) => {
                hookEvents.push({
                    hook: 'shouldNotRetry',
                    path: item.test.path,
                    processID: meta.processID,
                });
            });
        controller
            .getHook(TestRunControllerPlugins.beforeTestRetry)
            ?.readHook('identity', (item: any, _error: Error, meta: any) => {
                hookEvents.push({
                    hook: 'beforeTestRetry',
                    path: item.test.path,
                    processID: meta.processID,
                });
            });
        controller
            .getHook(TestRunControllerPlugins.afterRun)
            ?.readHook('ordering', () => hookEvents.push({hook: 'afterRun'}));

        await controller.runQueue(tests);

        const originalID = testWorker.state.replacements[0]?.previousWorkerID;
        const failedAttemptIDs = hookEvents
            .filter(
                ({path, hook}) =>
                    path === tests[0]?.path && hook !== 'beforeTest',
            )
            .map(({processID}) => processID);
        chai.expect(originalID).to.be.a('string');
        chai.expect(failedAttemptIDs).to.deep.equal([originalID, originalID]);
        chai.expect(testWorker.getTotalAttemptCount()).to.equal(4);
        chai.expect(hookEvents.at(-1)?.hook).to.equal('afterRun');

        const timeout = events.find(({event}) => event === 'TEST_TIMEOUT');
        const replacement = events.find(
            ({event}) => event === 'WORKER_REPLACED',
        );
        const retry = events.find(({event}) => event === 'RETRY_DECISION');
        const summaries = events.filter(({event}) => event === 'RUN_SUMMARY');
        chai.expect(
            events.filter(({event}) => event === 'TEST_TIMEOUT'),
        ).to.have.lengthOf(1);
        chai.expect(
            events.filter(({event}) => event === 'WORKER_REPLACED'),
        ).to.have.lengthOf(1);
        chai.expect(
            events.filter(({event}) => event === 'RETRY_DECISION'),
        ).to.have.lengthOf(1);
        chai.expect(timeout?.fields).to.include({
            testPath: tests[0]?.path,
            retryCount: 0,
            attempt: 1,
            processID: originalID,
            workerID: originalID,
            timeoutMs: 20,
            signal: 'SIGABRT',
        });
        chai.expect(timeout?.fields.queueRemaining).to.be.a('number');
        chai.expect(timeout?.fields.error).to.be.instanceOf(Error);
        chai.expect(timeout?.fields.error.stack).to.be.a('string');
        chai.expect(replacement?.fields).to.include({
            reason: 'test_timeout',
            processID: originalID,
            previousWorkerID: originalID,
            replacementWorkerID:
                testWorker.state.replacements[0]?.replacementWorkerID,
        });
        chai.expect(retry?.fields).to.include({
            testPath: tests[0]?.path,
            processID: originalID,
            decision: 'scheduled',
            nextRetry: 1,
        });
        chai.expect(summaries).to.have.lengthOf(1);
        chai.expect(summaries[0]?.fields).to.include({
            outcome: 'COMPLETE',
            plannedInitial: 3,
            startedInitial: 3,
            completedInitial: 3,
            retriesEligible: 1,
            retriesScheduled: 1,
            retriesCompleted: 1,
            activeWorkers: 0,
            queueRemaining: 0,
            errors: 1,
            stopReason: 'none',
        });
        chai.expect(events.at(-1)?.event).to.equal('RUN_SUMMARY');
    });

    it('contains a non-bail hook failure and drains unrelated work', async () => {
        const tests = generateTestFiles(3);
        const worker = new RecordingTestWorker({
            executionDelay: (path) => (path === tests[1]?.path ? 20 : 0),
        });
        const controller = new TestRunController(
            {
                bail: false,
                workerLimit: 2,
                retryCount: 1,
                testTimeout: DEFAULT_TIMEOUT,
            } as any,
            worker,
        );
        const events = captureControllerLogs(controller);
        controller
            .getHook(TestRunControllerPlugins.afterTest)
            ?.writeHook('broken-after-test', (item: any) => {
                if (item.test.path === tests[0]?.path) {
                    throw new Error('afterTest failed');
                }
                return item;
            });

        const errors = (await controller.runQueue(tests)) as Error[];

        chai.expect(worker.getTotalAttemptCount()).to.equal(3);
        chai.expect(errors.some(({message}) => message === 'afterTest failed')).to.equal(
            true,
        );
        chai.expect(
            events.find(({event}) => event === 'HOOK_FAILED')?.fields,
        ).to.include({
            hook: TestRunControllerPlugins.afterTest,
            testPath: tests[0]?.path,
            retryCount: 0,
            processID: 'worker/1',
            workerID: 'worker/1',
        });
        const hookFailure = events.find(
            ({event}) => event === 'HOOK_FAILED',
        )?.fields;
        chai.expect(hookFailure.queueRemaining).to.be.a('number');
        chai.expect(hookFailure.activeWorkers).to.be.a('number');
        chai.expect(hookFailure.error).to.be.instanceOf(Error);
        chai.expect(hookFailure.error.stack).to.be.a('string');
        chai.expect(events.at(-1)?.event).to.equal('RUN_SUMMARY');
    });

    it('bail stops new starts but waits for active work', async () => {
        const tests = generateTestFiles(3);
        const worker = new RecordingTestWorker({
            executionDelay: (path) => (path === tests[1]?.path ? 20 : 0),
            shouldFailAttempt: (path) => path === tests[0]?.path,
        });
        const controller = new TestRunController(
            {
                bail: true,
                workerLimit: 2,
                retryCount: 1,
                testTimeout: DEFAULT_TIMEOUT,
            } as any,
            worker,
        );
        const events = captureControllerLogs(controller);

        const errors = (await controller.runQueue(tests)) as Error[];

        chai.expect(errors).to.have.lengthOf(1);
        chai.expect(worker.getTotalAttemptCount()).to.equal(2);
        chai.expect(events.at(-1)?.fields).to.include({
            outcome: 'BAILED',
            activeWorkers: 0,
            queueRemaining: 1,
            stopReason: 'bail',
        });
    });

    it('timeout preserves attempt identity for 100 deterministic repetitions', async () => {
        for (let repetition = 0; repetition < 100; repetition++) {
            const tests = generateTestFiles(3);
            const worker = new RecordingTestWorker({
                shouldHangAttempt: (path, attempt) =>
                    path === tests[0]?.path && attempt === 0,
            });
            const controller = new TestRunController(
                {
                    bail: false,
                    workerLimit: 2,
                    retryCount: 1,
                    retryDelay: 0,
                    testTimeout: 1,
                } as any,
                worker,
            );
            const events = captureControllerLogs(controller);
            const retryIDs: string[] = [];
            controller
                .getHook(TestRunControllerPlugins.beforeTestRetry)
                ?.readHook('identity', (_item: any, _error: Error, meta: any) =>
                    retryIDs.push(meta.processID),
                );

            await controller.runQueue(tests);

            chai.expect(retryIDs).to.deep.equal([
                worker.state.replacements[0]?.previousWorkerID,
            ]);
            chai.expect(worker.getTotalAttemptCount()).to.equal(4);
            chai.expect(events.at(-1)?.event).to.equal('RUN_SUMMARY');
            chai.expect(events.at(-1)?.fields.outcome).to.equal('COMPLETE');
        }
    });
});
