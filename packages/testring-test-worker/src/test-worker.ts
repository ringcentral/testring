import { Transport } from '@testring/transport';
import { PluggableModule } from '@testring/pluggable-module';
import { TestWorkerInstance } from './test-worker-instance';

export enum TestWorkerPlugin {
    compile = 'compile'
}

export class TestWorker extends PluggableModule {

    private compile = (source: string, filename: string) => {
        return this.callHook(TestWorkerPlugin.compile, source, filename);
    };

    constructor(private transport: Transport) {
        super([
            [TestWorkerPlugin.compile, 2]
        ]);
    }

    spawn() {
        return new TestWorkerInstance(this.transport, this.compile);
    }
}
