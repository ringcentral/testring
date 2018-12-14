import { IFSReader, IFile, FSReaderPlugins } from '@testring/types';
import { PluggableModule } from '@testring/pluggable-module';
import { locateFiles } from './file-locator';
import { resolveFiles, readFile } from './file-resolver';
import { loggerClient } from '@testring/logger';


export class FSReader extends PluggableModule implements IFSReader {

    constructor() {
        super([
            FSReaderPlugins.beforeResolve,
            FSReaderPlugins.afterResolve,
        ]);
    }

    public async find(pattern: string): Promise<IFile[]> {
        const tests = await locateFiles(pattern);
        const testsAfterPlugin = await this.callHook(FSReaderPlugins.beforeResolve, tests);

        if (!testsAfterPlugin || testsAfterPlugin.length === 0) {
            loggerClient.error(`No test files found by pattern: ${pattern}`);
            throw new Error(`No test files found by pattern: ${pattern}`);
        }

        const resolvedFiles = await resolveFiles(testsAfterPlugin);

        return await this.callHook(
            FSReaderPlugins.afterResolve,
            resolvedFiles
        );
    }

    public async readFile(fileName: string): Promise<IFile | null> {
        return readFile(fileName);
    }
}
