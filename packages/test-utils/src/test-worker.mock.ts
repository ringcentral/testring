import { ITestWorker, ITestWorkerInstance } from '@testring/types';

class TestWorkerMockInstance implements ITestWorkerInstance {

    private executeCalls = 0;

    constructor(private shouldFail: boolean) {
    }

    execute() {
        this.executeCalls++;

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

    $getExecuteCallsCount() {
        return this.executeCalls;
    }
}

export class TestWorkerMock implements ITestWorker {

    private spawnedInstances: Array<TestWorkerMockInstance> = [];

    constructor(private shouldFail: boolean = false) {
    }

    spawn() {
        const instance = new TestWorkerMockInstance(this.shouldFail);

        this.spawnedInstances.push(instance);

        return instance;
    }

    $getSpawnedCount() {
        return this.spawnedInstances.length;
    }

    $getExecutionCallsCount() {
        return this.spawnedInstances.reduce((count, instance) => {
            return count + instance.$getExecuteCallsCount();
        }, 0);
    }
}
