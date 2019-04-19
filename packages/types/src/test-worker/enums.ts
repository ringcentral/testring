export const enum TestWorkerPlugin {
    beforeCompile = 'beforeCompile',
    compile = 'compile',
}

export const enum TestEvents {
    started = 'test/started',
    finished = 'test/finished',
    failed = 'test/failed',
}

export const enum TestStatus {
    idle = 'idle',
    done = 'done',
    failed = 'failed',
}

export const enum TestWorkerAction {
    evaluateCode = 'TestWorkerAction/evaluateCode',
    releaseTest = 'TestWorkerAction/releaseTest',
    executeTest = 'TestWorkerAction/executeTest',
    executionComplete = 'TestWorkerAction/executionComplete',
    pauseTestExecution = 'TestWorkerAction/pauseTestExecution',
    resumeTestExecution = 'TestWorkerAction/resumeTestExecution',
    runTillNextExecution = 'TestWorkerAction/runTillNextExecution',
}
