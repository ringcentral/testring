/// <reference types="node" />
/// <reference types="mocha" />

import * as chai from 'chai';
import { transport } from '@testring/transport';
import { SANDBOX_TRANSPORT_NAME, TestEvents } from '../src/constants';
import { TestWorker, TestWorkerPlugin } from '../src/test-worker';

describe('TestWorkerInstance', () => {
    const defaultSyncTestContent = 'process.cwd()';
    const defaultFilename = './test.js';

    context('test execution', () => {
        it('should run sync test', async () => {
            const testWorker = new TestWorker(transport);
            const instance = testWorker.spawn();

            try {
                await instance.execute(defaultSyncTestContent, defaultFilename, {});
            } catch (e) {
                throw e.error;
            } finally {
                instance.kill();
            }
        });

        it('should fail sync test correctly',  (callback) => {
            const rawSource = 'throw new Error("Something happened")';

            const testWorker = new TestWorker(transport);
            const instance = testWorker.spawn();

            instance.execute(rawSource, defaultFilename, {})
                .then(() => {
                    callback('Test was completed somehow');
                })
                .catch((message) => {
                    chai.expect(message.error).to.be.an.instanceof(Error);
                    chai.expect(message.test.source).to.be.equal(rawSource);
                    chai.expect(message.test.filename).to.be.equal(defaultFilename);

                    callback();
                })
                .catch(callback)
                .then(() => {
                    instance.kill();
                });
        });

        it('should run async test', async () => {
            const rawSource = `
                global['${SANDBOX_TRANSPORT_NAME}'].emit('${TestEvents.started}');
                
                setTimeout(() => {
                    global['${SANDBOX_TRANSPORT_NAME}'].emit('${TestEvents.finished}');
                }, 0);
            `;

            const testWorker = new TestWorker(transport);
            const instance = testWorker.spawn();

            try {
                await instance.execute(rawSource, defaultFilename, {});
            } catch (e) {
                throw e.error;
            } finally {
                instance.kill();
            }
        });

        it('should fail async test correctly',  (callback) => {
            const errorText = 'oops';
            const rawSource = `
                global['${SANDBOX_TRANSPORT_NAME}'].emit('${TestEvents.started}');
                
                async function test() {
                    throw new Error('${errorText}');
                }
                
                test().catch((e) => {
                    global['${SANDBOX_TRANSPORT_NAME}'].emit('${TestEvents.failed}', e);
                });
            `;

            const testWorker = new TestWorker(transport);
            const instance = testWorker.spawn();

            instance.execute(rawSource, defaultFilename, {})
                .then(() => {
                    callback('Test was completed somehow');
                })
                .catch((message) => {
                    chai.expect(message.error).to.be.an.instanceof(Error);
                    chai.expect(message.error.message).to.be.equal(errorText);
                    chai.expect(message.test.source).to.be.equal(rawSource);
                    chai.expect(message.test.filename).to.be.equal(defaultFilename);

                    callback();
                })
                .catch(callback)
                .then(() => {
                    instance.kill();
                });
        });
    });

    it('should fail execution, if process was killed', (callback) => {
        const testWorker = new TestWorker(transport);
        const instance = testWorker.spawn();

        instance.execute(defaultSyncTestContent, defaultFilename, {})
            .then(() => {
                callback('Test was completed somehow');
            })
            .catch(() => {
                callback();
            });

        instance.kill();
    });

    context('compilation', () => {
        it('should compile source without errors', (callback) => {
            const testWorker = new TestWorker(transport);
            const instance = testWorker.spawn();

            const hook = testWorker.getHook(TestWorkerPlugin.compile);

            if (hook) {
                hook.tapPromise('testPlugin', (source, file) => {
                    chai.expect(source).to.be.equal(defaultSyncTestContent);
                    chai.expect(file).to.be.equal(defaultFilename);
                    callback();

                    return Promise.resolve(source);
                });
            }

            instance.execute(defaultSyncTestContent, defaultFilename, {}).catch(() => {});
            instance.kill();
        });

        it('should handle compilation exception', (callback) => {
            const testWorker = new TestWorker(transport);
            const instance = testWorker.spawn();

            const hook = testWorker.getHook(TestWorkerPlugin.compile);

            if (hook) {
                hook.tapPromise('testPlugin', (source, file) => {
                    // throw new Error('compilation failed');

                    return Promise.reject(new Error('compilation failed'));
                });
            }

            instance.execute(defaultSyncTestContent, defaultFilename, {})
                .then(() => {
                    callback('Test was compiled somehow');
                })
                .catch((message) => {
                    chai.expect(message.error);
                    callback();
                })
                .catch(callback)
                .then(() => {
                    instance.kill();
                });
        });
    });
});
