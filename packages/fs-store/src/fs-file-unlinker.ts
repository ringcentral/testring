import { promisify } from 'util';
import { unlink } from 'fs';

import { FSStoreClient } from './fs-store-client';


const delFile = promisify(unlink);

/**
 * 
 */
export class FSFileUnlinker {

    private fsStoreClient: FSStoreClient;

    constructor() {
        this.fsStoreClient = new FSStoreClient();
    }

    // get unique name & write data into it & return filename
    public async unlink(fileName): Promise<string> {

        return new Promise((resolve, reject) => {
            // get file name from master process
            const reqId = this.fsStoreClient
                .getUnlinkPermission(async (filePath: string ) => {
                    await delFile(filePath);
                    this.fsStoreClient.releasePermission(reqId);
                    resolve(filePath);
                },
                {
                    requestId: '11',                    
                });
        });            
    }    
}
