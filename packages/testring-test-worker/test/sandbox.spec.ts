/// <reference types="node" />
/// <reference types="mocha" />

import * as chai from 'chai';
import { fileReaderFactory } from './utils';
import { Sandbox } from '../src/worker/sandbox';

const fixturesFileReader = fileReaderFactory(__dirname, 'fixtures', 'sandbox');

const createExportFromGlobal = (key) => {
    return `module.exports = global["${key}"];`;
};

describe('Sandbox', () => {
    afterEach(() => Sandbox.clearCache());

    context('Compilation', () => {
        it('should compile module', async () => {
            const source = await fixturesFileReader('simple-module.js');

            const sandbox = new Sandbox(source, 'simple-module.js');
            const module = sandbox.execute();

            chai.expect(module).to.be.equal('Hello, world!');
        });

        it('should throw exception, if code have some inner exceptions', async () => {
            const source = await fixturesFileReader('eval-error.js');

            const sandbox = new Sandbox(source, 'eval-error.js');

            try {
                sandbox.execute();

                return Promise.reject('Code was compiled');
            } catch  {
                return Promise.resolve();
            }
        });

        it('should throw SyntaxError, when can\'t compile code', async () => {
            const source = await fixturesFileReader('es6-export.js');

            const sandbox = new Sandbox(source, 'es6-export.js');

            try {
                sandbox.execute();

                return Promise.reject('Code was compiled');
            } catch (error) {
                chai.expect(error).to.be.instanceof(SyntaxError);
            }
        });

        it('should wrap string exception into EvalError', async () => {
            const source = await fixturesFileReader('string-exception.js');
            const sandbox = new Sandbox(source, 'string-exception.js');

            try {
                sandbox.execute();

                return Promise.reject('Code was compiled');
            } catch (exception) {
                chai.expect(exception).to.be.instanceof(EvalError);
            }
        });
    });

    context('Environment', () => {
        it('should have all primitives provided', async () => {
            const source = await fixturesFileReader('primitives.js');

            const sandbox = new Sandbox(source, 'primitives.js');

            sandbox.execute(); // should not throw
        });

        it('should correctly pass "instanceof" check for all primitives', async () => {
            const source = await fixturesFileReader('primitives.js');
            const sandbox = new Sandbox(source, 'primitives.js');
            const {
                array,
                map,
                set,
                weakMap,
                weakSet,
                promise,
                buffer
            } = sandbox.execute();

            chai.expect(array instanceof Array).to.be.equal(true);
            chai.expect(map instanceof Map).to.be.equal(true);
            chai.expect(set instanceof Set).to.be.equal(true);
            chai.expect(weakMap instanceof WeakMap).to.be.equal(true);
            chai.expect(weakSet instanceof WeakSet).to.be.equal(true);
            chai.expect(promise instanceof Promise).to.be.equal(true);
            chai.expect(buffer instanceof Buffer).to.be.equal(true);
        });

        it('should set global variables into own context', async () => {
            const source = await fixturesFileReader('global-variable.js');
            const sandbox = new Sandbox(source, 'global-variable.js');

            const module = sandbox.execute();
            const context = sandbox.getContext();

            chai.expect(module).to.be.equal(true);
            chai.expect(context['amaGlobal']).to.be.equal(true);
            chai.expect(global['amaGlobal']).to.be.equal(undefined);
        });

        it('should correctly handle function declarations', async () => {
            const source = await fixturesFileReader('function-declaration.js');
            const sandbox = new Sandbox(source, 'function-declaration.js');

            sandbox.execute();

            chai.expect(sandbox.execute()).to.be.equal(1);
        });

        it('should read global variables from current process context', () => {
            const key = '__$test-machine_sandbox_test_dependency$__';
            const sandbox = new Sandbox(createExportFromGlobal(key), 'global.js');

            global[key] = {};

            sandbox.execute();

            const context = sandbox.getContext();

            chai.expect(context[key]).to.be.equal(global[key]);

            delete global[key];
        });
    });

    context('Resolve', () => {
        it('should import from "node_modules"', async () => {
            const source = await fixturesFileReader('external-dependency.js');
            const sandbox = new Sandbox(source, 'external-dependency.js');

            chai.expect(sandbox.execute()).to.be.equal(true);

        });

        it('should import native module', async () => {
            const source = await fixturesFileReader('native-dependency.js');
            const sandbox = new Sandbox(source, 'native-dependency.js');

            chai.expect(sandbox.execute()).to.be.equal(true);
        });

        it('should throw ReferenceError, when can\'t resolve dependency', async () => {
            const source = await fixturesFileReader('invalid-dependency.js');
            const sandbox = new Sandbox(source, 'invalid-dependency.js');

            try {
                sandbox.execute();

                return Promise.reject('Code was compiled');
            } catch (error) {
                chai.expect(error).to.be.instanceof(Error);
            }
        });
    });

    context('Exports', () => {
        it('should correctly handle exports reference', async () => {
            const source = await fixturesFileReader('exports-reference.js');
            const sandbox = new Sandbox(source, 'exports-reference.js');

            chai.expect(sandbox.execute().data).to.be.equal(true);
        });

        it('should add fields to "module" object', async () => {
            const source = await fixturesFileReader('module-mutation.js');
            const sandbox = new Sandbox(source, 'module-mutation.js');

            const module = sandbox.execute();
            const context = sandbox.getContext();

            chai.expect(module).to.be.equal(true);
            chai.expect(context.module.customField).to.be.equal(true);
        });

        it('should correctly provide commonjs module.exports object', async () => {
            const source = await fixturesFileReader('commonjs-module-exports.js');
            const sandbox = new Sandbox(source, 'commonjs-module-exports.js');

            chai.expect(sandbox.execute().equals).to.be.equal(true);
        });

        it('should correctly provide commonjs exports object', async () => {
            const source = await fixturesFileReader('commonjs-exports.js');
            const sandbox = new Sandbox(source, 'commonjs-exports.js');

            chai.expect(sandbox.execute().equals).to.be.equal(true);
        });
    });

    context('Transport', () => {
        it('should send data by ref', (callback) => {
            const data = {};

            fixturesFileReader('transport-triggering.js').then((source) => {
                const sandbox = new Sandbox(source, 'transport-triggering.js');
                const transport = sandbox.getTransport();

                transport.once('response', (responseData) => {
                    chai.expect(responseData).to.be.equal(data);

                    callback();
                });

                sandbox.execute();
                transport.emit('request', data);
            });
        });
    });
});
