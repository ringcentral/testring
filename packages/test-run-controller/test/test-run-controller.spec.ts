import * as chai from 'chai';
import { TestWorkerMock } from '@testring/test-utils';
import { TestRunControllerPlugins } from '../../types/src/test-run-controller';
import { TestRunController } from '../src/test-run-controller';

const DEFAULT_TIMEOUT = 60 * 1000;

const generateTestFile = (index: number) => ({
    path: `qwerty-${index}.js`,
    content: `console.log(${index})`,
    meta: {},
});

const generateTestFiles = (count: number) => Array.from({ length: count }, (v, i) => generateTestFile(i));

describe('Controller', () => {
    it('should run spawn workers with count from according limit', async () => {
        const workerLimit = 20;
        const config = { bail: false, workerLimit: workerLimit, timeout: DEFAULT_TIMEOUT } as any;

        const tests = generateTestFiles(40);

        const testWorkerMock = new TestWorkerMock();
        const testRunController = new TestRunController(config, testWorkerMock);

        await testRunController.runQueue(tests);

        chai.expect(testWorkerMock.$getSpawnedCount()).to.be.equal(workerLimit);
    });

    it('should run spawn workers by test count, if limit is higher', async () => {
        const testsCount = 2;
        const config = { bail: false, workerLimit: 10, timeout: DEFAULT_TIMEOUT } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock();
        const testRunController = new TestRunController(config, testWorkerMock);

        await testRunController.runQueue(tests);

        chai.expect(testWorkerMock.$getSpawnedCount()).to.be.equal(testsCount);
    });

    it('should fail instantly, if bail flag passed', async () => {
        const config = { bail: true, workerLimit: 2, timeout: DEFAULT_TIMEOUT } as any;

        const tests = generateTestFiles(2);

        const testWorkerMock = new TestWorkerMock(true);
        const testRunController = new TestRunController(config, testWorkerMock);

        const errors = await testRunController.runQueue(tests);

        chai.expect(errors).to.be.lengthOf(1);
    });

    it('should use retries when test fails', async () => {
        const testsCount = 3;
        const retriesCount = 5;
        const config = { workerLimit: 2, retryDelay: 0, retryCount: retriesCount, testTimeout: DEFAULT_TIMEOUT } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock(true);
        const testRunController = new TestRunController(config, testWorkerMock);

        const errors = await testRunController.runQueue(tests);

        const executionCalls = testWorkerMock.$getExecutionCallsCount();

        // Errors are generated only when last retry has failed
        chai.expect(errors).to.be.lengthOf(testsCount);

        // Runner must try to run all failed test with given retries number
        chai.expect(executionCalls).to.be.equal(testsCount + testsCount * retriesCount);
    });

    it('should be matching processID meta', async () => {
        const config = { bail: true, workerLimit: 2, timeout: DEFAULT_TIMEOUT } as any;
        const tests = generateTestFiles(2);

        const testWorkerMock = new TestWorkerMock();
        const testRunController = new TestRunController(config, testWorkerMock);
        const beforeTest = testRunController.getHook(TestRunControllerPlugins.beforeTest);
        const afterTest = testRunController.getHook(TestRunControllerPlugins.afterTest);

        if (beforeTest && afterTest) {
            beforeTest.readHook('testPlugin', (entry, { processID }) => {
                chai.expect(processID).to.be.equal(testWorkerMock.$getInstanceName());
            });

            afterTest.writeHook('testPlugin', (entry, error, { processID }) => {
                chai.expect(processID).to.be.equal(testWorkerMock.$getInstanceName());
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
        const config = { bail: true, workerLimit: testsCount, timeout: DEFAULT_TIMEOUT } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock(true);
        const testRunController = new TestRunController(config, testWorkerMock);
        const beforeTest = testRunController.getHook(TestRunControllerPlugins.beforeTest);
        const afterTest = testRunController.getHook(TestRunControllerPlugins.afterTest);


        if (beforeTest && afterTest) {
            beforeTest.readHook('testPlugin', (entry, { processID }) => {
                chai.expect(processID).to.be.equal(testWorkerMock.$getInstanceName());
            });

            afterTest.writeHook('testPlugin', (entry, error, { processID }) => {
                chai.expect(processID).to.be.equal(testWorkerMock.$getInstanceName());
                chai.expect(error).to.be.deep.equal(testWorkerMock.$getErrorInstance());
            });
        }

        const errors = await testRunController.runQueue(tests);
        chai.expect(errors).to.be.lengthOf(testsCount);
        chai.expect((errors || [])[0]).to.be.deep.equal(testWorkerMock.$getErrorInstance());
    });
});
