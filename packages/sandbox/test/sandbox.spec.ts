/// <reference types="mocha" />

import { DependencyDict } from '@testring/types';
import * as chai from 'chai';
import { fileReaderFactory, fileResolverFactory } from '@testring/test-utils';
import { Sandbox } from '../src/sandbox';

const fixturesFileReader = fileReaderFactory(__dirname, 'fixtures', 'sandbox');
const fixturesFileResolver = fileResolverFactory(__dirname, 'fixtures', 'sandbox');

const createExportFromGlobal = (key) => {
    return `module.exports = global["${key}"];`;
};

const generateDependencyDict = async (filename: string, source?: string): Promise<DependencyDict> => {
    let loadedSource;
    if (source) {
        loadedSource = source;
    } else {
        loadedSource = await fixturesFileReader(filename);
    }

    return {
        [filename]: {
            source: loadedSource,
            transpiledSource: loadedSource,
            dependencies: {},
        },
    };
};

describe('Sandbox', () => {
    afterEach(() => Sandbox.clearCache());

    // TODO add dependencies tests

    context('Compilation', () => {
        it('should compile module', async () => {
            const filename = 'simple-module.js';
            const dependencies = await generateDependencyDict(filename);

            const sandbox = new Sandbox(filename, dependencies);
            const module = sandbox.execute();

            chai.expect(module).to.be.equal('Hello, world!');
        });

        it('should throw exception, if code have some inner exceptions', async () => {
            const filename = 'eval-error.js';
            const dependencies = await generateDependencyDict(filename);

            const sandbox = new Sandbox(filename, dependencies);

            try {
                sandbox.execute();

                return Promise.reject('Code was compiled');
            } catch {
                return Promise.resolve();
            }
        });

        it('should throw SyntaxError, when can\'t compile code', async () => {
            const filename = 'es6-export.js';
            const dependencies = await generateDependencyDict(filename);

            const sandbox = new Sandbox(filename, dependencies);

            try {
                sandbox.execute();

                return Promise.reject('Code was compiled');
            } catch (error) {
                chai.expect(error).to.be.instanceof(SyntaxError);
            }
        });

        it('should wrap string exception into EvalError', async () => {
            const filename = 'string-exception.js';
            const dependencies = await generateDependencyDict(filename);

            const sandbox = new Sandbox(filename, dependencies);

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
            const filename = 'primitives.js';
            const dependencies = await generateDependencyDict(filename);

            const sandbox = new Sandbox(filename, dependencies);

            sandbox.execute(); // should not throw
        });

        it('should correctly pass "instanceof" check for all primitives', async () => {
            const filename = 'primitives.js';
            const dependencies = await generateDependencyDict(filename);

            const sandbox = new Sandbox(filename, dependencies);
            const {
                array,
                map,
                set,
                weakMap,
                weakSet,
                promise,
                buffer,
                error,
            } = sandbox.execute();

            chai.expect(array instanceof Array).to.be.equal(true);
            chai.expect(map instanceof Map).to.be.equal(true);
            chai.expect(set instanceof Set).to.be.equal(true);
            chai.expect(weakMap instanceof WeakMap).to.be.equal(true);
            chai.expect(weakSet instanceof WeakSet).to.be.equal(true);
            chai.expect(promise instanceof Promise).to.be.equal(true);
            chai.expect(buffer instanceof Buffer).to.be.equal(true);
            chai.expect(error instanceof Error).to.be.equal(true);
        });

        it('should set global variables into own context', async () => {
            const filename = 'global-variable.js';
            const dependencies = await generateDependencyDict(filename);

            const sandbox = new Sandbox(filename, dependencies);

            const module = sandbox.execute();
            const context = sandbox.getContext();

            chai.expect(module).to.be.equal(true);
            chai.expect(context['amaGlobal']).to.be.equal(true);
            chai.expect(global['amaGlobal']).to.be.equal(undefined);
        });

        it('should correctly handle function declarations', async () => {
            const filename = 'function-declaration.js';
            const dependencies = await generateDependencyDict(filename);

            const sandbox = new Sandbox(filename, dependencies);

            sandbox.execute();

            chai.expect(sandbox.execute()).to.be.equal(1);
        });

        it('should read global variables from current process context', async () => {
            const key = '__$test-machine_sandbox_test_dependency$__';
            const filename = 'global.js';
            const dependencies = await generateDependencyDict(filename, createExportFromGlobal(key));

            const sandbox = new Sandbox(filename, dependencies);

            global[key] = {};

            sandbox.execute();

            const context = sandbox.getContext();

            chai.expect(context[key]).to.be.equal(global[key]);

            delete global[key];
        });
    });

    context('Resolve', () => {
        it('should import from "node_modules"', async () => {
            const filename = 'external-dependency.js';
            const dependencies = await generateDependencyDict(filename);

            const sandbox = new Sandbox(filename, dependencies);

            chai.expect(sandbox.execute()).to.be.equal(true);

        });

        it('should import native module', async () => {
            const filename = 'native-dependency.js';
            const dependencies = await generateDependencyDict(filename);

            const sandbox = new Sandbox(filename, dependencies);

            chai.expect(sandbox.execute()).to.be.equal(true);
        });

        it('should throw ReferenceError, when can\'t resolve dependency', async () => {
            const filename = 'invalid-dependency.js';
            const dependencies = await generateDependencyDict(filename);

            const sandbox = new Sandbox(filename, dependencies);

            try {
                sandbox.execute();

                return Promise.reject('Code was compiled');
            } catch (error) {
                chai.expect(error).to.be.instanceof(Error);
            }
        });

        it('should resolve circular dependencies', async () => {
            const testData = {
                test: true,
                someData: [1, 2, 3],
            };

            const sourceName1 = './cyclic-dependency';
            const sourceName2 = './cyclic-dependency-2';

            const sourceNameFile1 = sourceName1 + '.js';
            const sourceNameFile2 = sourceName2 + '.js';

            const source1 = await fixturesFileReader(sourceNameFile1);
            const source2 = `
                require('${sourceName1}');
                
                module.exports = ${JSON.stringify(testData)};
            `;

            const filePath1 = await fixturesFileResolver(sourceNameFile1);
            const filePath2 = await fixturesFileResolver(sourceNameFile2);

            const sandbox1 = new Sandbox(filePath1, {
                [filePath2]: {
                    source: source2,
                    transpiledSource: source2,
                    dependencies: {
                        [sourceName1]: filePath1,
                    },
                },
                [filePath1]: {
                    source: source1,
                    transpiledSource: source1,
                    dependencies: {
                        [sourceName2]: filePath2,
                    },
                },
            });

            const result = sandbox1.execute();

            chai.expect(result).to.be.deep.equal(testData);
        });

        it('should handle error propagation in circular dependency', async () => {
            const sourceName1 = './cyclic-dependency';
            const sourceName2 = './cyclic-dependency-2';

            const sourceNameFile1 = sourceName1 + '.js';
            const sourceNameFile2 = sourceName2 + '.js';

            const source1 = await fixturesFileReader(sourceNameFile1);
            const source2 = `
                require('${sourceName1}');
                
                throw new Error('test');
            `;

            const filePath1 = await fixturesFileResolver(sourceNameFile1);
            const filePath2 = await fixturesFileResolver(sourceNameFile2);

            let error;

            try {
                const sandbox1 = new Sandbox(filePath1, {
                    [filePath2]: {
                        source: source2,
                        transpiledSource: source2,
                        dependencies: {
                            [sourceName1]: filePath1,
                        },
                    },
                    [filePath1]: {
                        source: source1,
                        transpiledSource: source1,
                        dependencies: {
                            [sourceName2]: filePath2,
                        },
                    },
                });

                sandbox1.execute();

                error = new Error('code executed somehow');
            } catch {
                error = null;
            }

            if (error) {
                throw error;
            }
        });
    });

    context('Exports', () => {
        it('should correctly handle exports reference', async () => {
            const filename = 'exports-reference.js';
            const dependencies = await generateDependencyDict(filename);

            const sandbox = new Sandbox(filename, dependencies);

            chai.expect(sandbox.execute().data).to.be.equal(true);
        });

        it('should add fields to "module" object', async () => {
            const filename = 'module-mutation.js';
            const dependencies = await generateDependencyDict(filename);

            const sandbox = new Sandbox(filename, dependencies);

            const module = sandbox.execute();
            const context = sandbox.getContext();

            chai.expect(module).to.be.equal(true);
            chai.expect(context.module.customField).to.be.equal(true);
        });

        it('should correctly provide commonjs module.exports object', async () => {
            const filename = 'commonjs-module-exports.js';
            const dependencies = await generateDependencyDict(filename);

            const sandbox = new Sandbox(filename, dependencies);

            chai.expect(sandbox.execute().equals).to.be.equal(true);
        });

        it('should correctly provide commonjs exports object', async () => {
            const filename = 'commonjs-exports.js';
            const dependencies = await generateDependencyDict(filename);

            const sandbox = new Sandbox(filename, dependencies);

            chai.expect(sandbox.execute().equals).to.be.equal(true);
        });
    });

    context('Evaluate', () => {
        it('Evaluate code in sandbox', async () => {
            const filename = 'test-data.js';
            const source = 'var test = 10;';
            const dependencies = await generateDependencyDict(filename, source);

            const sandbox = new Sandbox(filename, dependencies);

            await sandbox.execute();

            await Sandbox.evaluateScript(filename, 'test = 20;');
            const context = sandbox.getContext();
            chai.expect(context.test).to.be.equal(20);
        });

        it('Evaluate with object mutation', async () => {
            const filename = 'test-data.js';
            const fnPath = 'hello';
            const source = `
                function ${fnPath}() {
                    __scopeManager.registerFunction("${fnPath}", null, this, arguments);
                    __scopeManager.registerVariable("${fnPath}", "obj", () => obj);
                    __scopeManager.registerVariable("${fnPath}", "test", () => obj.key);
                    var obj = { key: 20 };
                    var test = obj.key;
                }
                hello();
            `;
            const dependencies = await generateDependencyDict(filename, source);
            const sandbox = new Sandbox(filename, dependencies);

            await sandbox.execute();

            await Sandbox.evaluateScript(filename, `
                __scopeExports = (async function () {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    obj.key = 30;
                    
                    return test + 40;
                })();
            `,
                fnPath
            );
            const context = sandbox.getContext();
            chai.expect(await Sandbox.getEvaluationResult(filename, fnPath)).to.be.equal(70);

            chai.expect(context.test).to.be.equal(undefined);

            Sandbox.clearEvaluationResult(filename, fnPath);
            chai.expect(await Sandbox.getEvaluationResult(filename, fnPath)).to.be.equal(undefined);
        });

        it('Evaluate with function redeclaration', async () => {
            const filename = 'test-data.js';
            const fnPath = 'hello';
            const fnCall = 'foo';

            const source = `
                let globalValue = 100;
                async function ${fnPath}() {
                    __scopeManager.registerFunction("${fnPath}", null, this, arguments);

                    return globalValue;
                }
                
                async function ${fnCall}() {
                    __scopeManager.registerFunction("${fnCall}", null, this, arguments);

                    return ${fnPath}();
                }
                
                module.exports = {
                    result: ${fnCall}(),
                };
            `;
            const dependencies = await generateDependencyDict(filename, source);
            const sandbox = new Sandbox(filename, dependencies);

            await sandbox.execute();

            const context = sandbox.getContext();
            chai.expect(await context.exports.result).to.be.equal(100);

            await Sandbox.evaluateScript(filename, `
                globalValue = 500;

                async function ${fnPath}() {
                    __scopeManager.registerFunction("${fnPath}", null, this, arguments);

                    return globalValue + 200;
                }
            `);

            await Sandbox.evaluateScript(filename, `
                module.exports = {
                    result: ${fnCall}(),
                };
            `);
            chai.expect(await context.exports.result).to.be.equal(700);

            chai.expect(context.test).to.be.equal(undefined);
        });
    });
});
