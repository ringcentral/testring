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

    getTestWorker() {
        this.lastTestWorker = new TestWorkerAPIMock();

        return this.lastTestWorker;
    }

    $getLastTestWorker() {
        return this.lastTestWorker;
    }
}
