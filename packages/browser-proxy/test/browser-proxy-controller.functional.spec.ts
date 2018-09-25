/// <reference types="mocha" />

import * as path from 'path';
import * as chai from 'chai';
import { Transport } from '@testring/transport';
import { fork } from '@testring/child-process';
import { BrowserProxyActions, BrowserProxyPlugins } from '@testring/types';
import { BrowserProxyController } from '../src/browser-proxy-controller';

const workerPath = path.resolve(__dirname, './fixtures/worker.ts');
const syncPlugin = path.resolve(__dirname, './fixtures/sync-plugin.ts');
const asyncPlugin = path.resolve(__dirname, './fixtures/async-plugin.ts');

describe('Browser proxy controller functional test', () => {
    it('should pass path to onAction plugin to workerCreator', (callback) => {
        const transport = new Transport();
        const controller = new BrowserProxyController(transport, (onActionPath) => {
            chai.expect(onActionPath).to.be.equal(onActionPath);

            callback();

            return fork(workerPath);
        });

        const onAction = controller.getHook(BrowserProxyPlugins.getPlugin);

        if (onAction) {
            onAction.writeHook('testPlugin', async () => {
                return {
                    plugin: syncPlugin,
                    config: null
                };
            });
        }

        controller.init().then(() => {
            return controller.execute('test', {
                action: BrowserProxyActions.click,
                args: []
            });
        }).then(() => {
            controller.kill();
        }).catch(() => {
            controller.kill();
        });
    });

    it('should be able to use child process passed as function as proxy', async () => {
        const transport = new Transport();
        const controller = new BrowserProxyController(transport, () => {
            return fork(workerPath, [
                '--name',
                syncPlugin,
                '--config',
                JSON.stringify(null)
            ]);
        });

        await controller.init();

        await controller.execute('test', {
            action: BrowserProxyActions.click,
            args: []
        });

        setImmediate(() => {
            controller.kill();
        });
    });

    it('should respawn proxy if connection is lost somehow', (callback) => {
        const transport = new Transport();
        const controller = new BrowserProxyController(transport, () => {
            return fork(workerPath, [
                '--name',
                syncPlugin,
                '--config',
                JSON.stringify(null)
            ]);
        });

        controller.init()
            .then(() => {
                controller.execute('test', {
                    action: BrowserProxyActions.click,
                    args: []
                })
                    .then(() => {
                        controller.kill();

                        callback();
                    })
                    .catch((e) => {
                        callback(e);
                    });
            })
            .catch(callback);
    });

    it('should throw exception if proxy response contains non-empty "exception" field', (callback) => {
        const transport = new Transport();
        const controller = new BrowserProxyController(transport, () => {
            return fork(workerPath, [
                '--name',
                syncPlugin,
                '--config',
                JSON.stringify(null)
            ]);
        });

        controller.init()
            .then(() => {
                controller.execute('test', {
                    action: 'barrelRoll' as BrowserProxyActions,
                    args: []
                })
                    .then(() => {
                        callback(new Error('passed somehow'));
                    })
                    .catch(() => {
                        controller.kill();

                        callback();
                    });
            })
            .catch(callback);
    });

    it('should be able to run multiple workers', async () => {
        const transport = new Transport();
        const controller = new BrowserProxyController(transport, (onActionPluginPath, config) => {
            return fork(workerPath, [
                '--name',
                onActionPluginPath,
                '--config',
                JSON.stringify(config)
            ]);
        });
        const hooks = controller.getHook(BrowserProxyPlugins.getPlugin);

        if (hooks) {
            hooks.writeHook('test', () => {
                return {
                    plugin: syncPlugin,
                    config: {
                        workerLimit: 2,
                    },
                };
            });
        }

        await controller.init();

        const testResult1 = await controller.execute('test1', {
            action: BrowserProxyActions.click,
            args: ['testResult']
        });
        chai.expect(testResult1).to.be.equal(testResult1);

        const testResult2 = await controller.execute('test2', {
            action: BrowserProxyActions.click,
            args: [{
                'key': 'value',
            }],
        });
        chai.expect(testResult2).to.be.deep.equal({
            'key': 'value',
        });

        const testResult3 = await controller.execute('test3', {
            action: BrowserProxyActions.click,
            args: [[1,2,3]]
        });
        chai.expect(testResult3).to.be.deep.equal([1,2,3]);

        chai.expect((controller as any).workersPool.size).to.be.equal(2);

        await controller.kill();
    });

    it('should be able to run multiple workers in parallel', async () => {
        const transport = new Transport();
        const controller = new BrowserProxyController(transport, (onActionPluginPath, config) => {
            return fork(workerPath, [
                '--name',
                onActionPluginPath,
                '--config',
                JSON.stringify(config)
            ]);
        });
        const hooks = controller.getHook(BrowserProxyPlugins.getPlugin);

        if (hooks) {
            hooks.writeHook('test', () => {
                return {
                    plugin: asyncPlugin,
                    config: {
                        workerLimit: 2,
                    },
                };
            });
        }

        await controller.init();

        let results = await Promise.all([
            await controller.execute('test1', {
                action: BrowserProxyActions.click,
                args: ['testResult'],
            }),
            await controller.execute('test2', {
                action: BrowserProxyActions.click,
                args: [{
                    'key': 'value',
                }],
            }),
            await controller.execute('test3', {
                action: BrowserProxyActions.click,
                args: [[1,2,3]],
            }),
        ]);

        chai.expect(results).to.be.deep.equal([
           'testResult',
            {
                'key': 'value',
            },
            [1,2,3],
        ]);

        chai.expect((controller as any).workersPool.size).to.be.equal(2);

        await controller.kill();
    });
});
