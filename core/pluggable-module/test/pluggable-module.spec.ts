/// <reference types="mocha" />

import * as chai from 'chai';
import { PluggableModule } from '../src/pluggable-module';

class TestModule extends PluggableModule {

    static hookName = 'testHook';

    constructor() {
        super([
            TestModule.hookName,
        ]);
    }

    call(...args) {
        return this.callHook(TestModule.hookName, ...args);
    }
}

describe('PluggableModule', () => {
    it('should handle sync hooks', (callback) => {
        const testData = {};
        const testModule = new TestModule();
        const hook = testModule.getHook(TestModule.hookName);

        if (hook) {
            hook.readHook('testPlugin', (data) => {
                chai.expect(data).to.be.equal(testData);
                callback();
            });

            testModule.call(testData);
        }
    });

    it('should handle async hooks', async () => {
        const testData = { main: 1 };
        const testModule = new TestModule();
        const hook = testModule.getHook(TestModule.hookName);

        if (hook) {
            hook.writeHook('testPlugin', async (data) => {
                return {
                    ...data,
                    additional: 1,
                };
            });

            const result = await testModule.call(testData);

            chai.expect(result).to.be.deep.equal({
                main: 1,
                additional: 1,
            });
        }
    });

    it('should process multiple arguments', async () => {
        const testData = { main: 1 };
        const testDataExtra = { mainExtra: 2 };
        const additional = { additional: 1 };

        const expectedResult= {
            main: 1,
            mainExtra: 2,
            additional: 1,
        };

        const testModule = new TestModule();
        const hook = testModule.getHook(TestModule.hookName);

        // eslint-disable-next-line no-unused-expressions
        chai.expect(!!hook).to.be.true;

        if (hook) {
            hook.writeHook('testPlugin1', async (data, dataExtra) => {
                chai.expect(data).to.be.deep.equal(testData);
                chai.expect(dataExtra).to.be.deep.equal(testDataExtra);
                return {
                    ...data,
                    ...dataExtra,
                    ...additional,
                };
            });
            hook.writeHook('testPlugin2', async (data, dataExtra) => {
                chai.expect(data).to.be.deep.equal(expectedResult);
                chai.expect(dataExtra).to.be.deep.equal(testDataExtra);
                return {
                    ...data,
                };
            });

            const result = await testModule.call(testData, testDataExtra);

            chai.expect(result).to.be.deep.equal(expectedResult);
        }
    });
});
