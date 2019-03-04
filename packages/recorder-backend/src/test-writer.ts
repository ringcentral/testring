import * as fs from 'fs';

export class TestWriter {
    test: string[] = [];

    addLine(line: string) {
        this.test.push(line);
    }

    writeTest() {
        const filePath = 'test.js';

        if (!fs.existsSync(filePath)) {
            fs.closeSync(fs.openSync(filePath, 'w'));
        }

        fs.writeFile(filePath, this.test.join('\n'), (err) => {
            if (err) {
                throw err;
            }
        });
    }
}
