/// <reference types="mocha" />

import * as chai from 'chai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
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

    const defaultConfig = {
        screenshots: 'disable' as ScreenshotsConfig,
        waitForRelease: false,
        localWorker: false,
    };

    context('test execution', () => {
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
