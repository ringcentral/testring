import { TestWorkerPlugin } from '@testring/types';
import { AbstractAPI } from './abstract';

export class TestWorkerAPI extends AbstractAPI {
    compile(handler: (code: string, filename: string) => Promise<string>) {
        this.registryWritePlugin(TestWorkerPlugin.compile, handler);
    }
}
