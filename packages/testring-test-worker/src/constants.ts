
export const SANDBOX_TRANSPORT_NAME = '__$transport$__';

export enum TestEvents {
    started = 'started',
    finished = 'finished',
    failed ='failed'
}

export enum TestStatus {
    idle = 'idle',
    pending = 'pending',
    done = 'done',
    failed = 'failed'
}

export enum WorkerAction {
    executeTest = 'executeTest',
    executionComplete = 'executionComplete'
}
