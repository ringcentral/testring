import { ITestWorker, ITestWorkerInstance } from '@testring/types';

class TestWorkerMockInstance implements ITestWorkerInstance {

    constructor(private shouldFail: boolean) {}

    execute() {
        if (this.shouldFail) {
            return Promise.reject({
                test: 'file.js',
                error: new Error('test')
            });
        }

        return Promise.resolve();
    }

    kill() {
    }
}

export class TestWorkerMock implements ITestWorker {

    private spawned = 0;

    constructor(private shouldFail: boolean = false) {}

    spawn() {
        this.spawned++;

        return new TestWorkerMockInstance(this.shouldFail);
    }

    $spawnedCount() {
        return this.spawned;
    }
}
