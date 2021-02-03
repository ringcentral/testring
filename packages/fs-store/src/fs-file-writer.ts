import { promisify } from 'util';
import {  writeFile } from 'fs';

import { FSStoreClient } from './fs-store-client';


const write = promisify(writeFile);

/**
 * 
 */
export class FSFileWriter {

    private fsWriterClient: FSStoreClient;

    constructor() {
        this.fsWriterClient = new FSStoreClient();
    }

    // get unique name & write data into it & return filename
    public async write(data: Buffer, options:Record<string,any>={}): Promise<string> {

        return new Promise((resolve, reject) => {
            // get file name from master process
            const reqId = this.fsWriterClient
                .getWritePermission(async (filePath: string) => {
                    await write(filePath, data, options);
                    this.fsWriterClient.releasePermission(reqId);
                    resolve(filePath);
                },
                {ext:options.ext || '.tmp'});
        });            
    }    
}
