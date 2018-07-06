/// <reference types="node" />
/// <reference types="mocha" />

// import * as path from 'path';
// import * as chai from 'chai';
// import { Transport } from '@testring/transport';
// import { fork } from '@testring/child-process';
// import { BrowserProxyActions, BrowserProxyPlugins } from '@testring/types';
// import { BrowserProxyController } from '../src/browser-proxy-controller';
//
// const workerPath = path.resolve(__dirname, './fixtures/worker.ts');
// const onActionPlugin = path.resolve(__dirname, './fixtures/on-action.ts');
//
// describe('Browser proxy controller functional test', () => {
//     it('should pass path to onAction plugin to workerCreator', (callback) => {
//         const transport = new Transport();
//         const controller = new BrowserProxyController(transport, (onActionPath) => {
//             chai.expect(onActionPath).to.be.equal(onActionPath);
//
//             callback();
//
//             return fork(workerPath);
//         });
//
//         const onAction = controller.getHook(BrowserProxyPlugins.getPlugin);
//
//         if (onAction) {
//             onAction.tapPromise('testPlugin', async () => {
//                 return onActionPlugin;
//             });
//         }
//
//         controller.spawn().then(() => {
//             controller.kill();
//         }).catch(() => {
//             controller.kill();
//         });
//     });
//
//     it('should be able to use child process passed as function as proxy', async () => {
//         const transport = new Transport();
//         const controller = new BrowserProxyController(transport, () => fork(workerPath));
//
//         await controller.spawn();
//
//         await controller.execute('test', {
//             action: BrowserProxyActions.click,
//             args: [],
//         });
//
//         setImmediate(() => {
//             controller.kill();
//         });
//     });
//
//     it('should respawn proxy if connection is lost somehow', (callback) => {
//         const transport = new Transport();
//         const controller = new BrowserProxyController(transport, () => fork(workerPath));
//
//         controller.spawn().then((pid) => {
//             controller.execute('test', {
//                 action: BrowserProxyActions.click,
//                 args: [],
//             }).then(() => {
//                 controller.kill();
//
//                 callback();
//             }).catch((e) => {
//                 callback(e);
//             });
//
//             process.kill(pid);
//         }).catch(callback);
//     });
//
//     it('should throw exception if proxy response contains non-empty "exception" field', (callback) => {
//         const transport = new Transport();
//         const controller = new BrowserProxyController(transport, () => fork(workerPath));
//
//         controller.spawn().then(() => {
//             controller.execute('test', {
//                 action: 'barrelRoll' as BrowserProxyActions,
//                 args: [],
//             }).then(() => {
//                 callback(new Error('passed somehow'));
//             }).catch(() => {
//                 controller.kill();
//
//                 callback();
//             });
//         }).catch(callback);
//     });
// });
