import {
    IConfig,
    IFile,
    IQueuedTest,
    IDevtoolRuntimeConfiguration,
    ITestQueuedTestRunData,
    ITestRunController,
    ITestWorker,
    ITestWorkerCallbackMeta,
    ITestWorkerInstance,
    TestRunControllerPlugins,
} from '@testring/types';
import {loggerClient} from '@testring/logger';
import {PluggableModule} from '@testring/pluggable-module';
import {Queue} from '@testring/utils';

type TestQueue = Queue<IQueuedTest>;
type StopReason = 'none' | 'bail' | 'cancelled' | 'unexpected';

const createRunAccounting = () => ({
    plannedInitial: 0,
    startedInitial: 0,
    completedInitial: 0,
    retriesEligible: 0,
    retriesScheduled: 0,
    retriesCompleted: 0,
    activeWorkers: 0,
    errors: 0,
});

const delay = (milliseconds: number) =>
    new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });

export class TestRunController
    extends PluggableModule
    implements ITestRunController
{
    private workers: Array<ITestWorkerInstance> = [];

    private errors: Array<Error> = [];

    private currentQueue: TestQueue | null = null;

    private currentRun: Promise<any> | null = null;

    private logger = loggerClient;

    private accounting = createRunAccounting();

    private stopReason: StopReason = 'none';

    constructor(
        private config: IConfig,
        private testWorker: ITestWorker,
        private devtoolConfig: IDevtoolRuntimeConfiguration | null = null,
    ) {
        super([
            TestRunControllerPlugins.beforeRun,
            TestRunControllerPlugins.beforeTest,
            TestRunControllerPlugins.afterTest,
            TestRunControllerPlugins.beforeTestRetry,
            TestRunControllerPlugins.afterRun,
            TestRunControllerPlugins.shouldNotExecute,
            TestRunControllerPlugins.shouldNotStart,
            TestRunControllerPlugins.shouldNotRetry,
        ]);
    }

    public async runQueue(testSet: Array<IFile>): Promise<Error[] | null> {
        this.errors = [];
        this.accounting = createRunAccounting();
        this.stopReason = 'none';
        const testQueue = await this.prepareTests(testSet);

        this.accounting.plannedInitial = testQueue.length;

        this.logger.debug('Run controller: tests queue created.');

        this.currentQueue = testQueue;
        this.currentRun = this.executeQueue(this.currentQueue);

        return this.currentRun;
    }

    public async kill(): Promise<void> {
        this.stopReason = 'cancelled';
        const terminations = await Promise.allSettled(
            this.workers.map((worker) => worker.kill()),
        );

        this.workers.length = 0;

        if (this.currentQueue) {
            this.currentQueue.clean();
        }

        const errors = terminations
            .filter(
                (result): result is PromiseRejectedResult =>
                    result.status === 'rejected',
            )
            .map(({reason}) => reason as Error);
        if (errors[0]) {
            Object.assign(errors[0], {terminationErrors: errors});
            throw errors[0];
        }
    }

    private async executeQueue(testQueue: TestQueue): Promise<Error[] | null> {
        let runError: Error | null = null;

        try {
            const shouldNotExecute = await this.callHook(
                TestRunControllerPlugins.shouldNotExecute,
                false,
                testQueue,
            );

            if (!!shouldNotExecute) {
                this.stopReason = 'cancelled';
                this.logger.info('The run queue execution was stopped.');
            } else {
                const configWorkerLimit = this.config.workerLimit;

                if (configWorkerLimit === 'local') {
                    await this.runLocalWorker(testQueue);
                } else if (
                    typeof configWorkerLimit === 'number' &&
                    configWorkerLimit > 0
                ) {
                    const workerLimit =
                        configWorkerLimit < testQueue.length
                            ? configWorkerLimit
                            : testQueue.length;

                    await this.runChildWorkers(testQueue, workerLimit);
                } else {
                    throw new Error(
                        `Invalid workerLimit argument value ${configWorkerLimit}`,
                    );
                }
            }
        } catch (error) {
            runError = error as Error;
            if (!this.errors.includes(runError)) {
                this.recordError(runError);
            }
            if (this.stopReason === 'none') {
                this.stopReason = this.config.bail ? 'bail' : 'unexpected';
            }
        }

        try {
            await this.callHook(TestRunControllerPlugins.afterRun, runError);
        } catch (error) {
            const hookError = error as Error;
            this.recordHookFailure(TestRunControllerPlugins.afterRun, hookError);
            if (this.stopReason === 'none') {
                this.stopReason = this.config.bail ? 'bail' : 'unexpected';
            }
        }

        this.logRunSummary(testQueue);

        if (this.errors.length > 0) {
            return this.errors;
        }

        return null;
    }

    /**
     * Normalizes the `restartWorker` config field (validated at config-load
     * time by `@testring/cli-config`) into a recycle-after-every-N-executions
     * threshold. `null` means never recycle based on test count.
     */
    private getRestartWorkerThreshold(): number | null {
        const {restartWorker} = this.config;

        if (restartWorker === true || restartWorker === 'always') {
            return 1;
        }

        if (typeof restartWorker === 'number') {
            // 0 and 1 both mean "recycle after every test file".
            return restartWorker === 0 ? 1 : restartWorker;
        }

        // `false`, `undefined`, or any other unexpected value -> never
        // recycle based on test count (today's default, unchanged).
        return null;
    }

    private async runLocalWorker(testQueue: TestQueue): Promise<void> {
        this.logger.debug('Run controller: Local worker is used.');

        if (this.getRestartWorkerThreshold() !== null) {
            this.logger.warn('Workers won`t be restarted on every test end.');
        }

        this.workers = this.createWorkers(1);
        const worker = this.workers[0];

        if (!worker) {
            throw new Error('Failed to create a test worker instance.');
        }

        while (testQueue.length > 0 && this.stopReason === 'none') {
            await this.executeWorker(worker, testQueue);
        }
    }

    private async runChildWorkers(
        testQueue: TestQueue,
        workerLimit: number,
    ): Promise<void> {
        this.logger.debug(`Run controller: ${workerLimit} worker(s) created.`);

        const restartWorkerThreshold = this.getRestartWorkerThreshold();

        this.workers = this.createWorkers(workerLimit);

        const workerLoops = await Promise.allSettled(
            this.workers.map(async (worker) => {
                let executionsSinceRestart = 0;
                let workerUsable = true;

                while (
                    (testQueue.length > 0 ||
                        this.accounting.activeWorkers > 0) &&
                    this.stopReason === 'none'
                ) {
                    if (testQueue.length === 0) {
                        await delay(0);
                        continue;
                    }

                    try {
                        workerUsable = await this.executeWorker(
                            worker,
                            testQueue,
                        );
                    } catch (error) {
                        if (this.config.bail) {
                            this.stopReason = 'bail';
                            throw error;
                        }
                        this.recordError(error as Error);
                        workerUsable = false;
                    }

                    if (!workerUsable) {
                        break;
                    }
                    executionsSinceRestart++;

                    if (
                        restartWorkerThreshold !== null &&
                        executionsSinceRestart >= restartWorkerThreshold
                    ) {
                        try {
                            await worker.kill();
                        } catch (error) {
                            this.recordError(error as Error);
                            workerUsable = false;
                            break;
                        }
                        executionsSinceRestart = 0;
                    }
                }
                if (workerUsable) {
                    try {
                        await worker.kill();
                    } catch (error) {
                        this.recordError(error as Error);
                    }
                }
            }),
        );

        const rejectedLoop = workerLoops.find(
            (result): result is PromiseRejectedResult =>
                result.status === 'rejected',
        );

        if (rejectedLoop) {
            throw rejectedLoop.reason;
        }
    }

    private createWorkers(limit: number): Array<ITestWorkerInstance> {
        const workers: Array<ITestWorkerInstance> = [];

        for (let index = 0; index < limit; index++) {
            workers.push(this.testWorker.spawn());
        }

        return workers;
    }

    private getWorkerMeta(
        worker: ITestWorkerInstance,
    ): ITestWorkerCallbackMeta {
        return {
            processID: worker.getWorkerID(),
            isLocal: this.config.workerLimit === 'local',
        };
    }

    private prepareTest(testFile: IFile): IQueuedTest {
        return {
            retryCount: 0,
            retryErrors: [],
            test: testFile,
            parameters: {},
            envParameters: {
                ...this.config.envParameters,
            },
        };
    }

    private getQueueItemWithRunData(queueItem: IQueuedTest): IQueuedTest {
        let screenshotsEnabled = false;
        const isRetryRun = queueItem.retryCount > 0;
        const {debug, httpThrottle, logLevel, devtool, screenshotPath} =
            this.config;

        if (this.config.screenshots === 'enable') {
            screenshotsEnabled = true;
        } else if (this.config.screenshots === 'afterError') {
            screenshotsEnabled = isRetryRun;
        }

        let devtoolConfig: IDevtoolRuntimeConfiguration | null = null;
        if (devtool) {
            devtoolConfig = this.devtoolConfig;
        }

        const runData: ITestQueuedTestRunData = {
            debug,
            logLevel,
            httpThrottle,
            screenshotsEnabled,
            devtool: devtoolConfig,
            isRetryRun,
            screenshotPath,
        };

        return {
            ...queueItem,
            parameters: {
                ...queueItem.parameters,
                runData,
            },
        };
    }

    private getForceRetryCount(): number {
        const forceRetryCount = Number(this.config.forceRetryCount);

        if (!Number.isInteger(forceRetryCount) || forceRetryCount <= 0) {
            return 0;
        }

        return forceRetryCount;
    }

    private isForceRetryMode(): boolean {
        return this.getForceRetryCount() > 0;
    }

    private shouldScheduleNextForcedAttempt(queueItem: IQueuedTest): boolean {
        return queueItem.retryCount < this.getForceRetryCount() - 1;
    }

    private getNextRetryQueueItem(queueItem: IQueuedTest): IQueuedTest {
        return this.getQueueItemWithRunData({
            ...queueItem,
            retryCount: queueItem.retryCount + 1,
        });
    }

    private scheduleNextForcedAttempt(
        queueItem: IQueuedTest,
        queue: TestQueue,
    ): void {
        if (this.shouldScheduleNextForcedAttempt(queueItem)) {
            queue.push(this.getNextRetryQueueItem(queueItem));
            this.accounting.retriesEligible++;
            this.accounting.retriesScheduled++;
        }
    }

    private async prepareTests(testFiles: Array<IFile>): Promise<TestQueue> {
        const testQueue = new Array(testFiles.length);

        for (let index = 0; index < testFiles.length; index++) {
            const testFile = testFiles[index];
            if (testFile !== undefined) {
                testQueue[index] = this.prepareTest(testFile);
            }
        }

        const modifierQueue = await this.callHook(
            TestRunControllerPlugins.beforeRun,
            testQueue,
        );

        return new Queue(
            (modifierQueue || []).map((item: IQueuedTest) =>
                this.getQueueItemWithRunData(item),
            ),
        );
    }

    private async onTestFailed(
        error: Error,
        worker: ITestWorkerInstance,
        queueItem: IQueuedTest,
        queue: TestQueue,
        meta: ITestWorkerCallbackMeta,
    ): Promise<void> {
        this.accounting.errors++;

        if (this.config.bail) {
            this.errors.push(error);
            await this.callAttemptHook(
                TestRunControllerPlugins.afterTest,
                worker,
                queueItem,
                meta,
                queueItem,
                error,
                meta,
            );
            this.logRetryDecision(queueItem, meta, 'not_scheduled', 'bail');
            this.stopReason = 'bail';
            throw error;
        }

        if (this.isForceRetryMode()) {
            this.errors.push(error);

            if (this.shouldScheduleNextForcedAttempt(queueItem)) {
                await delay(this.config.retryDelay || 0);

                await this.callAttemptHook(
                    TestRunControllerPlugins.beforeTestRetry,
                    worker,
                    queueItem,
                    meta,
                    queueItem,
                    error,
                    meta,
                );

                queue.push(this.getNextRetryQueueItem(queueItem));
                this.accounting.retriesEligible++;
                this.accounting.retriesScheduled++;
                this.logRetryDecision(
                    queueItem,
                    meta,
                    'scheduled',
                    'policy_allowed',
                );
            } else {
                await this.callAttemptHook(
                    TestRunControllerPlugins.afterTest,
                    worker,
                    queueItem,
                    meta,
                    queueItem,
                    error,
                    meta,
                );
                this.logRetryDecision(
                    queueItem,
                    meta,
                    'not_scheduled',
                    'limit',
                );
            }

            return;
        }

        const retryHook = await this.callAttemptHook<boolean>(
            TestRunControllerPlugins.shouldNotRetry,
            worker,
            queueItem,
            meta,
            false,
            queueItem,
            meta,
        );
        const shouldNotRetry = retryHook.value;

        if (
            !shouldNotRetry &&
            queueItem.retryCount < (this.config.retryCount || 0)
        ) {
            await delay(this.config.retryDelay || 0);

            const copyQueueItem = this.getNextRetryQueueItem(queueItem);

            await this.callAttemptHook(
                TestRunControllerPlugins.beforeTestRetry,
                worker,
                queueItem,
                meta,
                queueItem,
                error,
                meta,
            );
            queue.push(copyQueueItem);
            this.accounting.retriesEligible++;
            this.accounting.retriesScheduled++;
            this.logRetryDecision(
                queueItem,
                meta,
                'scheduled',
                'policy_allowed',
            );
        } else {
            this.errors.push(error);

            await this.callAttemptHook(
                TestRunControllerPlugins.afterTest,
                worker,
                queueItem,
                meta,
                queueItem,
                error,
                meta,
            );
            this.logRetryDecision(
                queueItem,
                meta,
                'not_scheduled',
                shouldNotRetry ? 'veto' : 'limit',
            );
        }
    }

    private async executeWorker(
        worker: ITestWorkerInstance,
        queue: TestQueue,
    ): Promise<boolean> {
        const queuedTest = queue.shift();

        if (!queuedTest) {
            return true;
        }

        const meta = this.getWorkerMeta(worker);
        let timer;
        let isRejectedByTimeout = false;
        let workerUsable = true;
        this.accounting.activeWorkers++;

        try {
            const timeout =
                queuedTest.parameters.testTimeout || this.config.testTimeout;

            const startGuard = await this.callAttemptHook<boolean>(
                TestRunControllerPlugins.shouldNotStart,
                worker,
                queuedTest,
                meta,
                false,
                queuedTest,
                meta,
            );

            if (startGuard.error || !!startGuard.value) {
                return workerUsable;
            }

            const beforeTest = await this.callAttemptHook(
                TestRunControllerPlugins.beforeTest,
                worker,
                queuedTest,
                meta,
                queuedTest,
                meta,
            );

            if (beforeTest.error) {
                return workerUsable;
            }

            if (queuedTest.retryCount === 0) {
                this.accounting.startedInitial++;
            }

            const raceQueue = [
                worker.execute(
                    queuedTest.test,
                    queuedTest.parameters,
                    queuedTest.envParameters,
                ),
            ];

            if (timeout > 0) {
                raceQueue.push(
                    new Promise((_resolve, reject) => {
                        timer = setTimeout(() => {
                            isRejectedByTimeout = true;
                            reject(
                                new Error(`Test timeout exceeded ${timeout}ms`),
                            );
                        }, timeout);
                    }),
                );
            }

            await Promise.race(raceQueue);

            // noinspection JSUnusedAssignment
            clearTimeout(timer);

            await this.callAttemptHook(
                TestRunControllerPlugins.afterTest,
                worker,
                queuedTest,
                meta,
                queuedTest,
                null,
                meta,
            );

            if (this.isForceRetryMode()) {
                this.scheduleNextForcedAttempt(queuedTest, queue);
            }
        } catch (error) {
            if (isRejectedByTimeout) {
                const previousWorkerID = worker.getWorkerID();
                this.logger.error('TEST_TIMEOUT', {
                    testPath: queuedTest.test.path,
                    retryCount: queuedTest.retryCount,
                    attempt: queuedTest.retryCount + 1,
                    processID: meta.processID,
                    workerID: previousWorkerID,
                    timeoutMs:
                        queuedTest.parameters.testTimeout ||
                        this.config.testTimeout,
                    signal: 'SIGABRT',
                    queueRemaining: queue.length,
                    error,
                });

                try {
                    await worker.kill('SIGABRT');
                    this.logger.warn('WORKER_REPLACED', {
                        reason: 'test_timeout',
                        testPath: queuedTest.test.path,
                        retryCount: queuedTest.retryCount,
                        processID: meta.processID,
                        previousWorkerID,
                        replacementWorkerID: worker.getWorkerID(),
                    });
                } catch (killError) {
                    this.recordError(killError as Error);
                    workerUsable = false;
                }
            }

            queuedTest.retryErrors.push(error);
            // noinspection JSUnusedAssignment
            clearTimeout(timer);

            await this.onTestFailed(
                error as Error,
                worker,
                queuedTest,
                queue,
                meta,
            );
        } finally {
            this.accounting.activeWorkers--;
            if (queuedTest.retryCount === 0) {
                this.accounting.completedInitial++;
            } else {
                this.accounting.retriesCompleted++;
            }
        }

        return workerUsable;
    }

    private async callAttemptHook<T = any>(
        hook: string,
        worker: ITestWorkerInstance,
        queueItem: IQueuedTest,
        meta: ITestWorkerCallbackMeta,
        ...args: any[]
    ): Promise<{value?: T; error?: Error}> {
        try {
            return {value: await this.callHook<T>(hook, ...args)};
        } catch (error) {
            const hookError = error as Error;
            this.recordHookFailure(
                hook,
                hookError,
                worker,
                queueItem,
                meta,
            );
            if (this.config.bail) {
                this.stopReason = 'bail';
            }
            return {error: hookError};
        }
    }

    private recordHookFailure(
        hook: string,
        error: Error,
        worker?: ITestWorkerInstance,
        queueItem?: IQueuedTest,
        meta?: ITestWorkerCallbackMeta,
    ): void {
        this.recordError(error);
        this.logger.error('HOOK_FAILED', {
            hook,
            ...(queueItem && {
                testPath: queueItem.test.path,
                retryCount: queueItem.retryCount,
                processID: meta?.processID,
                workerID: worker?.getWorkerID(),
            }),
            queueRemaining: this.currentQueue?.length || 0,
            activeWorkers: this.accounting.activeWorkers,
            error,
        });
    }

    private recordError(error: Error): void {
        this.accounting.errors++;
        if (!this.errors.includes(error)) {
            this.errors.push(error);
        }
    }

    private logRetryDecision(
        queueItem: IQueuedTest,
        meta: ITestWorkerCallbackMeta,
        decision: 'scheduled' | 'not_scheduled',
        reason: string,
    ): void {
        this.logger.info('RETRY_DECISION', {
            testPath: queueItem.test.path,
            retryCount: queueItem.retryCount,
            processID: meta.processID,
            decision,
            reason,
            nextRetry:
                decision === 'scheduled' ? queueItem.retryCount + 1 : null,
            queueRemaining: this.currentQueue?.length || 0,
        });
    }

    private logRunSummary(testQueue: TestQueue): void {
        const queueRemaining = testQueue.length;
        let outcome = 'INCOMPLETE';

        if (this.stopReason === 'bail' || this.stopReason === 'cancelled') {
            outcome = 'BAILED';
        } else if (
            this.accounting.plannedInitial ===
                this.accounting.completedInitial &&
            this.accounting.retriesScheduled ===
                this.accounting.retriesCompleted &&
            this.accounting.activeWorkers === 0 &&
            queueRemaining === 0
        ) {
            outcome = 'COMPLETE';
        }
        const summary = {
            outcome,
            ...this.accounting,
            queueRemaining,
            stopReason: this.stopReason,
        };

        if (outcome === 'COMPLETE') {
            this.logger.info('RUN_SUMMARY', summary);
        } else {
            this.logger.error('RUN_SUMMARY', summary);
        }
    }
}
