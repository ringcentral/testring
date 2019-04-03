import * as fs from 'fs';

export class TestWriter {
    private test: string[] = [];

    constructor(private readonly filePath: string) { }

    addLine(line: string) {
        this.test.push(line);
    }

    write() {
        if (!fs.existsSync(this.filePath)) {
            fs.closeSync(fs.openSync(this.filePath, 'w'));
        }

        fs.writeFile(this.filePath, this.test.join('\n'), (err) => {
            if (err) {
                throw err;
            }
        });
    }
}
