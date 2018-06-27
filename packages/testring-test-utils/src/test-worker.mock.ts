import { ITestWorker, ITestWorkerInstance } from '@testring/types';

class TestWorkerMockInstance implements ITestWorkerInstance {
    execute() {
        return Promise.resolve();
    }

    kill() {
    }
}

export class TestWorkerMock implements ITestWorker {
    spawn() {
        return new TestWorkerMockInstance();
    }
}
