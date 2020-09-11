import { promisify } from 'util';
import {  writeFile } from 'fs';
import { LoggerClient , loggerClient } from '@testring/logger';

import { FSQueueClient } from './fs-queue-client';

const write = promisify(writeFile);

/**
 * 
 */
export class FSFileWriter {

    private fsWriterClient: FSQueueClient;

    constructor() {
        this.fsWriterClient = new FSQueueClient();
    }

    // get unique name & write data into it & return filename
    public async write(data: Buffer, options={}, logger: LoggerClient = loggerClient): Promise<string> {

        return new Promise((resolve, reject) => {
            // get file name from master process
            const reqId = this.fsWriterClient.getPermission(async (filePath: string)=>{
                await write(filePath, data, options);
                this.fsWriterClient.releasePermission(reqId);
                logger.file(filePath);
                resolve(filePath);
            });
        });            
    }    
}
