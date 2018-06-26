import { TestRunController } from '../src/test-run-controller';
import { TestWorkerMock } from './test-worker.mock';

describe('Controller', () => {
    it('should run tests queue', async () => {
        const tests = [
            {
                path: 'qwerty',
                content: 'console.log(1)',
                meta: {}
            },
            {
                path: 'qwerty1',
                content: 'console.log(2)',
                meta: {}
            }
        ];

        const testWorkerMock: any = new TestWorkerMock();
        const testRunController = new TestRunController({ bail: false }, testWorkerMock);

        await testRunController.runQueue(tests);
    });
});
