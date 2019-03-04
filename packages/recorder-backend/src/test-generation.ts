class TestGeneration {
    test: string[] = [];

    getActionLine(manager: string, action: string, path: string) {
        return `${manager}.${action}(${path})`;
    }

    addLine(line: string) {
        this.test.push(line);
    }
}

export const testGeneration = new TestGeneration();
