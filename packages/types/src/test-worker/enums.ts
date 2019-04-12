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
    evaluateCode = 'evaluateCode',
    releaseTest = 'releaseTest',
    executeTest = 'executeTest',
    executionComplete = 'executionComplete',
    pauseTestExecution = 'pauseTestExecution',
    resumeTestExecution = 'resumeTestExecution',
    runTillNextExecution = 'runTillNextExecution',
}
