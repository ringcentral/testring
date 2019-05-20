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
    executeTest = 'TestWorkerAction/executeTest',
    executionComplete = 'TestWorkerAction/executionComplete',

    // devtool actions
    register = 'TestWorkerAction/register',
    updateExecutionState = 'TestWorkerAction/updateExecutionState',
    unregister = 'TestWorkerAction/unregister',
    updateDependencies = 'TestWorkerAction/updateDependencies',
    startScope = 'TestWorkerAction/startScope',
    endScope = 'TestWorkerAction/endScope',

    evaluateCode = 'TestWorkerAction/evaluateCode',
    releaseTest = 'TestWorkerAction/releaseTest',
    pauseTestExecution = 'TestWorkerAction/pauseTestExecution',
    resumeTestExecution = 'TestWorkerAction/resumeTestExecution',
    runTillNextExecution = 'TestWorkerAction/runTillNextExecution',
}
