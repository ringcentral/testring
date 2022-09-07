import {TestWorkerPlugin} from '@testring-dev/types';
import {AbstractAPI} from './abstract';

export class TestWorkerAPI extends AbstractAPI {
    beforeCompile(
        handler: (
            paths: Array<string>,
            filenameEntry: string,
            codeEntry: string,
        ) => Promise<Array<string>>,
    ) {
        this.registryWritePlugin(TestWorkerPlugin.beforeCompile, handler);
    }

    compile(handler: (code: string, filename: string) => Promise<string>) {
        this.registryWritePlugin(TestWorkerPlugin.compile, handler);
    }
}
