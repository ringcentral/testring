import {Transport} from '@testring/transport';
import {BrowserProxyController} from '../src/browser-proxy-controller';
import {fork} from '@testring/child-process';
import * as path from 'path';
import {BrowserProxyActions, BrowserProxyPlugins} from '@testring/types';
import * as chai from 'chai';
import * as sinon from 'sinon';

const workerPath = path.resolve(__dirname, './fixtures/worker.ts');
const asyncPlugin = path.resolve(__dirname, './fixtures/async-plugin.ts');
const syncPlugin = path.resolve(__dirname, './fixtures/sync-plugin.ts');

describe('Browser Proxy Controller functional test for local worker', () => {
    it('should not call workerCreator if workerLimit is set to local', async () => {
        const workerCreatorMock = sinon.spy();
        const transport = new Transport();
        const controller = new BrowserProxyController(
            transport,
            workerCreatorMock,
        );
        const hooks = controller.getHook(BrowserProxyPlugins.getPlugin);

        if (hooks) {
            hooks.writeHook('test', () => {
                return {
                    plugin: syncPlugin,
                    config: {
                        workerLimit: 'local',
                    },
                };
            });
        }

        await controller.init();

        await controller.execute('test', {
            action: BrowserProxyActions.click,
            args: [],
        });

        chai.expect(workerCreatorMock.notCalled).to.be.equal(true);

        await controller.kill();
    });

    it('should throw exception if proxy response contains non-empty "exception" field', async () => {
        const workerCreatorMock = sinon.spy();
        const transport = new Transport();
        const controller = new BrowserProxyController(
            transport,
            workerCreatorMock,
        );
        const hooks = controller.getHook(BrowserProxyPlugins.getPlugin);

        if (hooks) {
            hooks.writeHook('test', () => {
                return {
                    plugin: syncPlugin,
                    config: {
                        workerLimit: 'local',
                    },
                };
            });
        }

        await controller.init();

        try {
            await controller.execute('test', {
                action: 'barrelRoll' as BrowserProxyActions,
                args: [],
            });
        } catch (e) {
            chai.expect(e).to.be.instanceOf(Error);
        }

        await controller.kill();
    });

    it('should be able to run multiple workers in parallel', async () => {
        const workerCreatorMock = sinon.spy();
        const transport = new Transport();
        const controller = new BrowserProxyController(
            transport,
            workerCreatorMock,
        );

        const hooks = controller.getHook(BrowserProxyPlugins.getPlugin);

        if (hooks) {
            hooks.writeHook('test', () => {
                return {
                    plugin: syncPlugin,
                    config: {
                        workerLimit: 'local',
                    },
                };
            });
        }

        await controller.init();

        const testResult1 = await controller.execute('test1', {
            action: BrowserProxyActions.click,
            args: ['testResult'],
        });

        chai.expect(testResult1).to.be.equal('testResult');

        const testResult2 = await controller.execute('test2', {
            action: BrowserProxyActions.click,
            args: [
                {
                    key: 'value',
                },
            ],
        });

        chai.expect(testResult2).to.be.deep.equal({
            key: 'value',
        });

        const testResult3 = await controller.execute('test3', {
            action: BrowserProxyActions.click,
            args: [[1, 2, 3]],
        });
        chai.expect(testResult3).to.be.deep.equal([1, 2, 3]);

        await controller.kill();
    });

    it('should be able to run multiple workers in parallel', async () => {
        const transport = new Transport();
        const controller = new BrowserProxyController(
            transport,
            (onActionPluginPath, config) => {
                return fork(workerPath, [
                    '--name',
                    onActionPluginPath,
                    '--config',
                    JSON.stringify(config),
                ]);
            },
        );
        const hooks = controller.getHook(BrowserProxyPlugins.getPlugin);

        if (hooks) {
            hooks.writeHook('test', () => {
                return {
                    plugin: asyncPlugin,
                    config: {
                        workerLimit: 'local',
                    },
                };
            });
        }

        await controller.init();

        const executePromises = Array.from({length: 100}, (_, i) => {
            return controller.execute(`test${i}`, {
                action: BrowserProxyActions.click,
                args: [Array.from({length: i * 10}, (__, j) => j)],
            });
        });

        const results = await Promise.all(executePromises);

        for (let i = 0; i < 100; i++) {
            chai.expect(results[i]).to.be.deep.equal(
                Array.from({length: i * 10}, (__, j) => j),
            );
        }

        await controller.kill();
    });
});
