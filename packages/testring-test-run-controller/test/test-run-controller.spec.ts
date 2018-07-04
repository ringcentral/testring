
import * as chai from 'chai';
import { TestWorkerMock } from '@testring/test-utils';
import { TestRunController } from '../src/test-run-controller';

const generageTestFile = (index: number) => ({
    path: `qwerty-${index}.js`,
    content: `console.log(${index})`,
    meta: {}
});

const generatedTestFiles = (count: number) => {
    return Array.from({ length: count}, (v, i) => generageTestFile(i));
};

describe('Controller', () => {
    it('should run spawn workers with count from according limit', async () => {
        const tests = generatedTestFiles(20);

        const testWorkerMock = new TestWorkerMock();
        const testRunController = new TestRunController({ bail: false, workerLimit: 5 }, testWorkerMock);

        await testRunController.runQueue(tests);

        chai.expect(testWorkerMock.$spawnedCount()).to.be.equal(5);
    });

    it('should run spawn workers by test count, if limit is higher', async () => {
        const tests = generatedTestFiles(2);

        const testWorkerMock = new TestWorkerMock();
        const testRunController = new TestRunController({ bail: false, workerLimit: 10 }, testWorkerMock);

        await testRunController.runQueue(tests);

        chai.expect(testWorkerMock.$spawnedCount()).to.be.equal(2);
    });

    it('should fail instantly, if bail flag passed', async () => {
        const tests = generatedTestFiles(2);

        const testWorkerMock = new TestWorkerMock(true);
        const testRunController = new TestRunController({ bail: true, workerLimit: 2 }, testWorkerMock);

        const errors = await testRunController.runQueue(tests);

        chai.expect(errors).to.be.lengthOf(1);
    });
});
