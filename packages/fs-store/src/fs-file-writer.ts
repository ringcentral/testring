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
    private logger: LoggerClient;

    constructor(logger: LoggerClient = loggerClient) {
        this.fsWriterClient = new FSQueueClient();
        this.logger = logger;
    }

    // get unique name & write data into it & return filename
    public async write(data: Buffer, options={}): Promise<string> {

        return new Promise((resolve, reject) => {
            // get file name from master process
            const reqId = this.fsWriterClient.getPermission(async (filePath: string)=>{
                await write(filePath, data, options);
                this.fsWriterClient.releasePermission(reqId);
                this.logger.file(filePath);
                resolve(filePath);
            });
        });            
    }    
}
