import { ITransport, ITestWorker } from '@testring/types';
import { PluggableModule } from '@testring/pluggable-module';
import { TestWorkerInstance } from './test-worker-instance';

export enum TestWorkerPlugin {
    compile = 'compile'
}

export class TestWorker extends PluggableModule implements ITestWorker {

    private compile = (source: string, filename: string) => {
        return this.callHook(TestWorkerPlugin.compile, source, filename);
    };

    constructor(private transport: ITransport) {
        super([
            [TestWorkerPlugin.compile, 2]
        ]);
    }

    spawn() {
        return new TestWorkerInstance(this.transport, this.compile);
    }
}
