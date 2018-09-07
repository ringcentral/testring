import { TestWorkerPlugin } from '@testring/types';
import { AbstractAPI } from './abstract';

export class TestWorkerAPI extends AbstractAPI {
    beforeCompile(handler: (paths: Array<string>, codeEntry: string, filenameEntry: string) => Promise<Array<string>>) {
        this.registryWritePlugin(TestWorkerPlugin.beforeCompile, handler);
    }

    compile(handler: (code: string, filename: string) => Promise<string>) {
        this.registryWritePlugin(TestWorkerPlugin.compile, handler);
    }
}
