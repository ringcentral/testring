class TestWorkerMockInstance {
    execute() {
        return Promise.resolve();
    }

    kill() {
    }
}

export class TestWorkerMock {
    spawn() {
        return new TestWorkerMockInstance();
    }
}
