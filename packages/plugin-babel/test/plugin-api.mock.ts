class TestWorkerAPIMock {
    private compilePlugin: Function;

    compile(fn) {
        this.compilePlugin = fn;
    }

    $compile(source, filename) {
        return this.compilePlugin(source, filename);
    }
}

export class PluginAPIMock {
    private lastTestWorker: TestWorkerAPIMock;

    getTestWorker(): TestWorkerAPIMock {
        this.lastTestWorker = new TestWorkerAPIMock();

        return this.lastTestWorker;
    }

    $getLastTestWorker(): TestWorkerAPIMock {
        return this.lastTestWorker;
    }
}
