/// <reference types="mocha" />

import * as chai from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {EventEmitter} from 'events';
import sinon from 'sinon';
import {Transport} from '@testring/transport';
import {
    ScreenshotsConfig,
    TestWorkerAction,
    TestWorkerPlugin,
    ITestExecutionCompleteMessage,
} from '@testring/types';
import {TestWorker} from '../src/test-worker';

describe('TestWorkerInstance', () => {
    const defaultSyncTestContent = 'process.cwd();';

    // Native `import()` requires a real file on disk (unlike the deleted
    // vm-sandbox, which could execute an arbitrary in-memory content
    // string under a synthetic path).
    let fixtureCounter = 0;

    function writeFixture(content: string): string {
        const filePath = path.join(
            os.tmpdir(),
            `testring-test-worker-spec-${process.pid}-${fixtureCounter++}.js`,
        );

        fs.writeFileSync(filePath, content);

        return filePath;
    }

    async function expectRejection(promise: Promise<unknown>) {
        let rejection: unknown;
        try {
            await promise;
        } catch (error) {
            rejection = error;
        }
        chai.expect(rejection).to.be.instanceOf(Error);
    }

    const defaultConfig = {
        screenshots: 'disable' as ScreenshotsConfig,
        waitForRelease: false,
        localWorker: false,
    };

    const attachWorker = (instance: any, worker: EventEmitter) => {
        instance.worker = worker;
        worker.on('error', instance.workerErrorHandler);
        worker.once('exit', instance.workerExitHandler);
    };

    context('termination', () => {
        it('should coalesce termination, signal once, and rotate identity once after exit', async () => {
            const instance: any = new TestWorker(
                new Transport(),
                defaultConfig,
            ).spawn();
            const worker: any = new EventEmitter();
            worker.kill = sinon.spy(() => {
                worker.emit('exit', 0);
                return true;
            });
            attachWorker(instance, worker);
            const workerID = instance.getWorkerID();

            const first = instance.kill('SIGTERM');
            const second = instance.kill('SIGABRT');
            await Promise.all([first, second]);

            chai.expect(worker.kill.calledOnceWith('SIGTERM')).to.equal(true);
            chai.expect(instance.getWorkerID()).not.to.equal(workerID);
        });

        it('should reject thrown and refused termination without rotating identity', async () => {
            for (const kill of [
                () => {
                    throw new Error('kill failed');
                },
                () => false,
            ]) {
                const instance: any = new TestWorker(
                    new Transport(),
                    defaultConfig,
                ).spawn();
                const worker: any = new EventEmitter();
                worker.kill = kill;
                attachWorker(instance, worker);
                const workerID = instance.getWorkerID();

                await expectRejection(instance.kill('SIGABRT'));
                chai.expect(instance.getWorkerID()).to.equal(workerID);
            }
        });

        it('should reject an active execution after five seconds and still clean up a late exit', async () => {
            const clock = sinon.useFakeTimers();
            try {
                const instance: any = new TestWorker(
                    new Transport(),
                    defaultConfig,
                ).spawn();
                const worker: any = new EventEmitter();
                worker.kill = () => true;
                attachWorker(instance, worker);
                const workerID = instance.getWorkerID();
                let executionError: Error | undefined;
                instance.abortTestExecution = (error: Error) => {
                    executionError = error;
                };

                const termination = instance.kill('SIGABRT');
                await clock.tickAsync(5000);
                await expectRejection(termination);

                chai.expect(executionError?.message).to.include(workerID);
                chai.expect(instance.getWorkerID()).to.equal(workerID);
                chai.expect(instance.worker).to.equal(worker);

                worker.emit('exit', 1);
                chai.expect(instance.worker).to.equal(null);
            } finally {
                clock.restore();
            }
        });

        it('should apply the same five-second deadline while worker initialization is queued', async () => {
            const clock = sinon.useFakeTimers();
            try {
                const instance: any = new TestWorker(
                    new Transport(),
                    defaultConfig,
                ).spawn();
                instance.queuedWorker = new Promise(() => undefined);

                const termination = instance.kill();
                await clock.tickAsync(5000);
                await expectRejection(termination);
            } finally {
                clock.restore();
            }
        });

        it('should settle 100 missing-exit terminations without leaving an operation pending', async () => {
            const clock = sinon.useFakeTimers();
            try {
                const terminations = Array.from({length: 100}, () => {
                    const instance: any = new TestWorker(
                        new Transport(),
                        defaultConfig,
                    ).spawn();
                    const worker: any = new EventEmitter();
                    worker.kill = () => true;
                    attachWorker(instance, worker);
                    return instance.kill();
                });
                const results = Promise.allSettled(terminations);

                await clock.tickAsync(5000);

                chai.expect(
                    (await results).every(({status}) => status === 'rejected'),
                ).to.equal(true);
            } finally {
                clock.restore();
            }
        });
    });

    context('test execution', () => {
        it('should freshly evaluate 100 consecutive attempts in one local worker', async () => {
            const key = `__testring_100_attempts_${fixtureCounter}`;
            const content = `
                globalThis[${JSON.stringify(key)}] = (globalThis[${JSON.stringify(key)}] || 0) + 1;
                if (globalThis[${JSON.stringify(key)}] % 2 === 0) throw new Error('even attempt');
                export {};
            `;
            const file = {content, path: writeFixture(content)};
            const instance = new TestWorker(new Transport(), {
                ...defaultConfig,
                localWorker: true,
            }).spawn();

            try {
                for (let attempt = 1; attempt <= 100; attempt++) {
                    if (attempt % 2 === 0) {
                        await expectRejection(instance.execute(file, {}, null));
                    } else {
                        await instance.execute(file, {}, null);
                    }
                }
            } finally {
                await instance.kill();
            }
        });

        for (const localWorker of [false, true]) {
            const mode = localWorker ? 'local' : 'forked';

            it(`should freshly evaluate the same path from pass to fail in a reused ${mode} worker`, async () => {
                const key = `__testring_pass_fail_${mode}`;
                const content = `
                    globalThis[${JSON.stringify(key)}] = (globalThis[${JSON.stringify(key)}] || 0) + 1;
                    if (globalThis[${JSON.stringify(key)}] === 2) throw new Error('second attempt');
                    export {};
                `;
                const file = {content, path: writeFixture(content)};
                const instance = new TestWorker(new Transport(), {
                    ...defaultConfig,
                    localWorker,
                }).spawn();

                await instance.execute(file, {}, null);

                try {
                    await expectRejection(instance.execute(file, {}, null));
                } finally {
                    await instance.kill();
                }
            });

            it(`should freshly evaluate the same path from fail to pass in a reused ${mode} worker`, async () => {
                const key = `__testring_fail_pass_${mode}`;
                const content = `
                    globalThis[${JSON.stringify(key)}] = (globalThis[${JSON.stringify(key)}] || 0) + 1;
                    if (globalThis[${JSON.stringify(key)}] === 1) throw new Error('first attempt');
                    export {};
                `;
                const file = {content, path: writeFixture(content)};
                const instance = new TestWorker(new Transport(), {
                    ...defaultConfig,
                    localWorker,
                }).spawn();

                await expectRejection(instance.execute(file, {}, null));

                try {
                    await instance.execute(file, {}, null);
                } finally {
                    await instance.kill();
                }
            });
        }

        it('should run sync test', async () => {
            const file = {
                content: defaultSyncTestContent,
                path: writeFixture(defaultSyncTestContent),
            };

            const transport = new Transport();
            const testWorker = new TestWorker(transport, defaultConfig);
            const instance = testWorker.spawn();

            try {
                await instance.execute(file, {}, null);
            } catch (error) {
                await instance.kill();
                throw error;
            }

            await instance.kill();
        });

        it('should fail sync test correctly', (callback) => {
            const content = 'throw new Error("Something happened")';
            const file = {
                content,
                path: writeFixture(content),
            };

            const transport = new Transport();
            const testWorker = new TestWorker(transport, defaultConfig);
            const instance = testWorker.spawn();

            instance
                .execute(file, {}, null)
                .then(() => {
                    callback('Test was completed somehow');
                })
                .catch((message: Error) => {
                    chai.expect(message).to.be.an.instanceof(Error);

                    callback();
                })
                .catch(callback)
                .then(() => instance.kill());
        });
    });

    it('should success execution, if process was killed by user during execution', () => {
        const file = {
            content: defaultSyncTestContent,
            path: writeFixture(defaultSyncTestContent),
        };

        const transport = new Transport();
        const testWorker = new TestWorker(transport, defaultConfig);
        const instance = testWorker.spawn();

        const execution = instance.execute(file, {}, null);

        instance.kill();

        return execution;
    });

    // Validates FR-014/FR-017 (worker-recycle-config and test-result-worker-id
    // contracts, SC-009/SC-010/SC-012): the worker ID surfaced via
    // getWorkerID() and reported on every executionComplete message must
    // stay stable across executions on one underlying child process, and
    // change once that process is killed and a new one spawned in its place.
    // Validates FR-009 (native ESM parsing of ambiguous `.js` autotest
    // files, with no `"type": "module"` anywhere in this workspace) for
    // BOTH worker modes. Neither mode needs a custom format override for
    // this: Node's own module-syntax detection (`detect-module`,
    // unflagged-to-default in Node 20.19.0 — inside this repo's `>=20.19`
    // floor) already parses an ambiguous `.js` file as an ES module once it
    // notices `import`/`export` syntax. A plain statement (e.g.
    // `process.cwd();`) would parse identically under CommonJS or ESM and
    // wouldn't catch a regression in that detection — top-level `export`
    // syntax is invalid CommonJS, so it only runs clean if the file was
    // genuinely parsed as an ES module.
    context('native ESM format without "type": "module" (FR-009)', () => {
        const esmOnlySyntaxContent = [
            "export const canary = 'esm';",
            "if (canary !== 'esm') {",
            "    throw new Error('canary was not initialized as expected');",
            '}',
        ].join('\n');

        it("should parse a forked worker's ambiguous .js file as ESM via Node's own module-syntax detection", async () => {
            const file = {
                content: esmOnlySyntaxContent,
                path: writeFixture(esmOnlySyntaxContent),
            };

            const transport = new Transport();
            const testWorker = new TestWorker(transport, defaultConfig);
            const instance = testWorker.spawn();

            await instance.execute(file, {}, null);

            await instance.kill();
        });

        it("should parse a local worker's ambiguous .js file as ESM via Node's own module-syntax detection", async () => {
            const file = {
                content: esmOnlySyntaxContent,
                path: writeFixture(esmOnlySyntaxContent),
            };

            const transport = new Transport();
            const testWorker = new TestWorker(transport, {
                ...defaultConfig,
                localWorker: true,
            });
            const instance = testWorker.spawn();

            await instance.execute(file, {}, null);

            await instance.kill();
        });
    });

    context('worker recycling / workerId (FR-014, FR-017)', () => {
        it('should keep the same workerId across sequential executions with no kill in between', async () => {
            const file = {
                content: defaultSyncTestContent,
                path: writeFixture(defaultSyncTestContent),
            };

            const transport = new Transport();
            const testWorker = new TestWorker(transport, defaultConfig);
            const instance = testWorker.spawn();

            await instance.execute(file, {}, null);
            const firstWorkerId = instance.getWorkerID();

            await instance.execute(file, {}, null);
            const secondWorkerId = instance.getWorkerID();

            await instance.kill();

            chai.expect(secondWorkerId).to.be.equal(firstWorkerId);
        });

        it('should use a new workerId after kill() before the next execution', async () => {
            const file = {
                content: defaultSyncTestContent,
                path: writeFixture(defaultSyncTestContent),
            };

            const transport = new Transport();
            const testWorker = new TestWorker(transport, defaultConfig);
            const instance = testWorker.spawn();

            await instance.execute(file, {}, null);
            const workerIdBeforeRecycle = instance.getWorkerID();

            await instance.kill();
            const workerIdAfterRecycle = instance.getWorkerID();

            await instance.execute(file, {}, null);
            const workerIdAfterRespawn = instance.getWorkerID();

            await instance.kill();

            chai.expect(workerIdAfterRecycle).to.not.be.equal(
                workerIdBeforeRecycle,
            );
            chai.expect(workerIdAfterRespawn).to.be.equal(
                workerIdAfterRecycle,
            );
        });

        it('should attach the executing workerId to every reported result, pass or fail', async () => {
            const passingFile = {
                content: defaultSyncTestContent,
                path: writeFixture(defaultSyncTestContent),
            };
            const failingContent =
                'throw new Error("workerId fixture failure")';
            const failingFile = {
                content: failingContent,
                path: writeFixture(failingContent),
            };

            const transport = new Transport();
            const testWorker = new TestWorker(transport, defaultConfig);
            const instance = testWorker.spawn();

            const captureNextMessage = () =>
                new Promise<ITestExecutionCompleteMessage>((resolve) => {
                    transport.once<ITestExecutionCompleteMessage>(
                        TestWorkerAction.executionComplete,
                        resolve,
                    );
                });

            const passingMessagePromise = captureNextMessage();
            await instance.execute(passingFile, {}, null);
            const passingMessage = await passingMessagePromise;

            const failingMessagePromise = captureNextMessage();
            await instance
                .execute(failingFile, {}, null)
                .catch(() => {
                    /* expected rejection, message assertions below cover it */
                });
            const failingMessage = await failingMessagePromise;

            // Captured before kill() — kill() rotates the workerId for
            // whatever respawn comes next, so it must be read beforehand to
            // reflect the worker that actually ran these two executions.
            const workerIdDuringBothExecutions = instance.getWorkerID();

            await instance.kill();

            chai.expect(passingMessage.workerId).to.be.equal(
                workerIdDuringBothExecutions,
            );
            chai.expect(failingMessage.workerId).to.be.equal(
                workerIdDuringBothExecutions,
            );
        });
    });

    context('compilation', () => {
        it('should compile source without errors', (callback) => {
            const filePath = writeFixture(defaultSyncTestContent);
            const file = {
                content: defaultSyncTestContent,
                path: filePath,
            };

            const transport = new Transport();
            const testWorker = new TestWorker(transport, defaultConfig);
            const instance = testWorker.spawn();

            const hook = testWorker.getHook(TestWorkerPlugin.compile);

            if (hook) {
                hook.writeHook('testPlugin', (source: any, writeFile: any) => {
                    chai.expect(source).to.be.equal(defaultSyncTestContent);
                    chai.expect(writeFile).to.be.equal(filePath);
                    callback();

                    return Promise.resolve(source);
                });
            }

            instance.execute(file, {}, null).catch(() => {
                /* empty */
            });

            instance.kill();
        });

        it('should handle compilation exception', (callback) => {
            const file = {
                content: defaultSyncTestContent,
                path: writeFixture(defaultSyncTestContent),
            };

            const transport = new Transport();
            const testWorker = new TestWorker(transport, defaultConfig);
            const instance = testWorker.spawn();

            const hook = testWorker.getHook(TestWorkerPlugin.compile);

            if (hook) {
                hook.writeHook('testPlugin', () => {
                    // throw new Error('compilation failed');

                    return Promise.reject(new Error('compilation failed'));
                });
            }

            instance
                .execute(file, {}, null)
                .then(() => {
                    callback('Test was compiled somehow');
                })
                .catch(() => {
                    callback();
                })
                .catch(callback)
                .then(() => {
                    instance.kill();
                });
        });
    });
});
