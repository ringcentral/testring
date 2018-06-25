import { PluggableModule } from '@testring/pluggable-module';
import { locateTestFiles } from './test-files-locator';
import { resolveTests } from './resolve-tests';

import { ITestFile } from '../interfaces';

export enum TestsFinderPlugins {
    beforeResolve = 'beforeResolve',
    afterResolve = 'afterResolve'
}

export class TestsFinder extends PluggableModule {

    constructor() {
        super([
            TestsFinderPlugins.beforeResolve,
            TestsFinderPlugins.afterResolve
        ]);
    }

    public async find(pattern: string): Promise<ITestFile[]> {
        const tests = await locateTestFiles(pattern);
        const testsAfterPlugin = await this.callHook(TestsFinderPlugins.beforeResolve, tests);

        if (!testsAfterPlugin || testsAfterPlugin.length === 0) {
            throw new Error(`No test files found by pattern: ${pattern} \nFiles: ${testsAfterPlugin}`);
        }

        const resolverTests = await resolveTests(testsAfterPlugin);

        return await this.callHook(
            TestsFinderPlugins.afterResolve,
            resolverTests
        );
    }
}
