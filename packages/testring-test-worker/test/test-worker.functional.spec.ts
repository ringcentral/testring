/// <reference types="mocha" />

import * as chai from 'chai';
import { Transport } from '@testring/transport';
import { ITestExecutionError, TestWorkerPlugin } from '@testring/types';
import { TestWorker } from '../src/test-worker';

describe('TestWorkerInstance', () => {
    const defaultSyncTestContent = 'process.cwd();';
    const defaultFilename = './test.js';

    context('test execution', () => {
        it('should run sync test', async () => {
            const transport = new Transport();
            const testWorker = new TestWorker(transport);
            const instance = testWorker.spawn();

            try {
                await instance.execute(defaultSyncTestContent, defaultFilename, {});
            } catch (error) {
                throw error.error;
            } finally {
                instance.kill();
            }
        });

        it('should fail sync test correctly', (callback) => {
            const rawSource = 'throw new Error("Something happened")';
            const transport = new Transport();
            const testWorker = new TestWorker(transport);
            const instance = testWorker.spawn();

            instance.execute(rawSource, defaultFilename, {})
                .then(() => {
                    callback('Test was completed somehow');
                })
                .catch((message: ITestExecutionError) => {
                    chai.expect(message.error).to.be.an.instanceof(Error);
                    chai.expect(message.test).to.be.equal(defaultFilename);

                    callback();
                })
                .catch(callback)
                .then(() => {
                    instance.kill();
                });
        });
    });

    it('should fail execution, if process was killed', (callback) => {
        const transport = new Transport();
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
            const transport = new Transport();
            const testWorker = new TestWorker(transport);
            const instance = testWorker.spawn();

            const hook = testWorker.getHook(TestWorkerPlugin.compile);

            if (hook) {
                hook.writeHook('testPlugin', (source, file) => {
                    chai.expect(source).to.be.equal(defaultSyncTestContent);
                    chai.expect(file).to.be.equal(defaultFilename);
                    callback();

                    return Promise.resolve(source);
                });
            }

            instance.execute(defaultSyncTestContent, defaultFilename, {}).catch(() => {
            });
            instance.kill();
        });

        it('should handle compilation exception', (callback) => {
            const transport = new Transport();
            const testWorker = new TestWorker(transport);
            const instance = testWorker.spawn();

            const hook = testWorker.getHook(TestWorkerPlugin.compile);

            if (hook) {
                hook.writeHook('testPlugin', (source, file) => {
                    // throw new Error('compilation failed');

                    return Promise.reject(new Error('compilation failed'));
                });
            }

            instance.execute(defaultSyncTestContent, defaultFilename, {})
                .then(() => {
                    callback('Test was compiled somehow');
                })
                .catch((message) => {
                    callback();
                })
                .catch(callback)
                .then(() => {
                    instance.kill();
                });
        });
    });
});
