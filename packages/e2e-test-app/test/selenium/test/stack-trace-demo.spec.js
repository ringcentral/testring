import {run} from 'testring';
import {getTargetUrl} from './utils';

// End-to-end regression guard for FR-002/SC-002 (User Story 1): a failing
// autotest's stack trace must point at the exact authored file/line, not a
// synthesized vm-sandbox frame. This runs through a real browser session
// (unlike core/test-worker's unit-level stack-trace-accuracy.spec.ts) to
// prove the guarantee holds through the full CLI -> worker -> native
// import() path, not just the worker in isolation.
run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'form.html'));

    function deliberatelyFailingHelper() {
        throw new Error('stack-trace-demo: deliberate known-line failure');
    }
    const knownThrowLine = 15;

    let caughtError;
    try {
        deliberatelyFailingHelper();
    } catch (error) {
        caughtError = error;
    }

    await app.assert.instanceOf(caughtError, Error);

    const stack = (caughtError && caughtError.stack) || '';
    const topFrame = stack.split('\n')[1] || '';

    await app.assert.include(
        topFrame,
        'stack-trace-demo.spec.js',
        'top stack frame should name this exact file',
    );
    await app.assert.include(
        topFrame,
        `:${knownThrowLine}:`,
        'top stack frame should point at the exact throw line',
    );
});
