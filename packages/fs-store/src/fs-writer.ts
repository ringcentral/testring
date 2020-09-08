import { writeFileSync, writeFile } from 'fs';


export class FSWriter {

    constructor(public fName: string) {}

    
    // reading file from disk and pass a return with promise wrapper
    async write(data: Buffer) {
        return new Promise((res, rej)=>{
            writeFile(this.fName, data, (err) => {
                if (err) {
                    return rej(err);
                }
                res();
            });
        });
    }
    
    writeSync(data: Buffer) {
        return writeFileSync(this.fName, data);
    }
}
