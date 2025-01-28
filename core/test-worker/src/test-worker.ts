import {
    ITransport,
    ITestWorker,
    ITestWorkerConfig,
    FileCompiler,
    TestWorkerPlugin,
} from '@testring/types';
import {PluggableModule} from '@testring/pluggable-module';
import {TestWorkerInstance} from './test-worker-instance';

export class TestWorker extends PluggableModule implements ITestWorker {
    private beforeCompile = async (paths: Array<string>) => {
        return this.callHook(TestWorkerPlugin.beforeCompile, paths);
    };

    private compile: FileCompiler = async (
        source: string,
        filename: string,
    ) => {
        return this.callHook(TestWorkerPlugin.compile, source, filename);
    };

    constructor(
        private transport: ITransport,
        private workerConfig: ITestWorkerConfig,
    ) {
        super([TestWorkerPlugin.beforeCompile, TestWorkerPlugin.compile]);
    }

    spawn() {
        return new TestWorkerInstance(
            this.transport,
            this.compile,
            this.beforeCompile,
            this.workerConfig,
        );
    }
}
