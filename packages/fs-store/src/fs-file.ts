import * as path from 'path';
import { writeFileSync, writeFile, mkdir } from 'fs';


export class FSFile {

    private path: string;

    constructor(public fName: string) {
        this.path = path.dirname(fName);
    }

    public getFileName() {
        return this.path;
    }

    public async ensureDir() {
        return new Promise((resolve, reject) => {
            mkdir(this.path, (err)=>{
                if (err && err.code !== 'EEXIST') {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
    
    // reading file from disk and pass a return with promise wrapper
    public async write(data: Buffer, encoding: string = 'binary') {
        return new Promise((res, rej)=>{
            writeFile(this.fName, new Buffer(data.toString(), 'base64'), encoding, (err) => {
                if (err) {
                    return rej(err);
                }
                res();
            });
        });
    }
    
    public writeSync(data: Buffer) {
        return writeFileSync(this.fName, data);
    }
}
