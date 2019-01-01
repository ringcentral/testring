import { ITestWorker, ITestWorkerInstance } from '@testring/types';

const ERROR_INSTANCE = {
    test: 'file.js',
    error: new Error('test'),
};

class TestWorkerMockInstance implements ITestWorkerInstance {

    private executeCalls = 0;
    private workerID = 'worker/test';

    constructor(private shouldFail: boolean) {
    }

    getWorkerID() {
        return this.workerID;
    }

    execute() {
        this.executeCalls++;

        if (this.shouldFail) {
            return Promise.reject(this.$getErrorInstance());
        }

        return Promise.resolve();
    }

    async kill() {
    }

    $getExecuteCallsCount() {
        return this.executeCalls;
    }

    $getErrorInstance() {
        return ERROR_INSTANCE;
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

    $getInstanceName() {
        return this.spawnedInstances[0].getWorkerID();
    }

    $getErrorInstance() {
        return this.spawnedInstances[0].$getErrorInstance();
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
