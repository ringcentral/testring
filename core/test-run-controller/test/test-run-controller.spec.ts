/// <reference types="mocha" />
/* eslint sonarjs/no-identical-functions: 0 */

import * as chai from 'chai';
import {TestWorkerMock} from '@testring/test-utils';
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

describe('TestRunController', () => {
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

        chai.expect(errors).to.be.lengthOf(1);
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
});
