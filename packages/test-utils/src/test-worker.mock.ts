import { ITestWorker, ITestWorkerInstance } from '@testring/types';
// import Timeout = NodeJS.Timeout;

const ERROR_INSTANCE = {
    test: 'file.js',
    error: new Error('test'),
};

type executionCallback = () => Promise<void> | void;

class TestWorkerMockInstance implements ITestWorkerInstance {

    private timeout: ReturnType<typeof setTimeout> | null = null;
    private callback: executionCallback | null = null;

    private executeCalls = 0;
    private killCalls = 0;
    private workerID = 'worker/test';

    constructor(private shouldFail: boolean, private executionDelay: number) {
    }

    getWorkerID() {
        return this.workerID;
    }

    execute() {
        this.executeCalls++;

        if (this.shouldFail) {
            if (this.executionDelay > 0) {
                return new Promise((resolve, reject) => {
                    this.callback = () => resolve();
                    this.timeout = setTimeout(() => reject(this.$getErrorInstance()), this.executionDelay);
                });
            } 
                return Promise.reject(this.$getErrorInstance());
            
        }

        if (this.executionDelay > 0) {
            return new Promise((resolve) => {
                this.callback = () => resolve();
                this.timeout = setTimeout(resolve, this.executionDelay);
            });
        } 
            return Promise.resolve();
        
    }

    async kill() {
        if (this.callback !== null) {
            const callback = this.callback;
            this.callback = null;
            setImmediate(() => callback());
        }

        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }

        this.killCalls++;
    }

    $getKillCallsCount() {
        return this.killCalls;
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

    constructor(private shouldFail: boolean = false, private executionDelay: number = 0) {
    }

    spawn() {
        const instance = new TestWorkerMockInstance(this.shouldFail, this.executionDelay);

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

    $getKillCallsCount() {
        return this.spawnedInstances.reduce((count, instance) => {
            return count + instance.$getKillCallsCount();
        }, 0);
    }

    $getExecutionCallsCount() {
        return this.spawnedInstances.reduce((count, instance) => {
            return count + instance.$getExecuteCallsCount();
        }, 0);
    }
}
