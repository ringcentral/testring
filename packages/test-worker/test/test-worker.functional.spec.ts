/// <reference types="mocha" />

import * as chai from 'chai';
import { Transport } from '@testring/transport';
import { TestWorkerPlugin } from '@testring/types';
import { TestWorker } from '../src/test-worker';

describe('TestWorkerInstance', () => {
    const defaultSyncTestContent = 'process.cwd();';
    const defaultFilename = './test.js';

    context('test execution', () => {
        it('should run sync test', async () => {
            const file = {
                content: defaultSyncTestContent,
                path: defaultFilename,
            };

            const transport = new Transport();
            const testWorker = new TestWorker(transport, { debug: false });
            const instance = testWorker.spawn();

            try {
                await instance.execute(file, {}, null);
            } catch (error) {
                throw error;
            } finally {
                await instance.kill();
            }
        });

        it('should fail sync test correctly', (callback) => {
            const file = {
                content: 'throw new Error("Something happened")',
                path: defaultFilename,
            };

            const transport = new Transport();
            const testWorker = new TestWorker(transport, { debug: false });
            const instance = testWorker.spawn();

            instance.execute(file, {}, null)
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
            path: defaultFilename,
        };

        const transport = new Transport();
        const testWorker = new TestWorker(transport, { debug: false });
        const instance = testWorker.spawn();

        const execution = instance.execute(file, {}, null);

        instance.kill();

        return execution;
    });

    context('compilation', () => {
        it('should compile source without errors', (callback) => {
            const file = {
                content: defaultSyncTestContent,
                path: defaultFilename,
            };

            const transport = new Transport();
            const testWorker = new TestWorker(transport, { debug: false });
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

            instance.execute(file, {}, null)
                .catch(() => {
                });

            instance.kill();
        });

        it('should handle compilation exception', (callback) => {
            const file = {
                content: defaultSyncTestContent,
                path: defaultFilename,
            };

            const transport = new Transport();
            const testWorker = new TestWorker(transport, { debug: false });
            const instance = testWorker.spawn();

            const hook = testWorker.getHook(TestWorkerPlugin.compile);

            if (hook) {
                hook.writeHook('testPlugin', () => {
                    // throw new Error('compilation failed');

                    return Promise.reject(new Error('compilation failed'));
                });
            }

            instance.execute(file, {}, null)
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
