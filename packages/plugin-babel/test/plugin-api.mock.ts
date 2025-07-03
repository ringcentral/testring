class TestWorkerAPIMock {
    private compilePlugin: (source: string, filename: string) => string = () => '';

    compile(fn: (source: string, filename: string) => string) {
        this.compilePlugin = fn;
    }

    $compile(source: string, filename: string) {
        return this.compilePlugin(source, filename);
    }
}

export class PluginAPIMock {
    private lastTestWorker: TestWorkerAPIMock = new TestWorkerAPIMock();

    getTestWorker(): TestWorkerAPIMock {
        this.lastTestWorker = new TestWorkerAPIMock();

        return this.lastTestWorker;
    }

    $getLastTestWorker(): TestWorkerAPIMock {
        return this.lastTestWorker;
    }
}
