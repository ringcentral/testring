import * as fs from 'fs';

import { FSStoreClient } from './fs-store-client';

const { writeFile, appendFile, unlink } = fs.promises;

export type ActionOptionsType = { path?: string; fileName: string; opts?: Record<string, any> }
    | { path: string; fileName?: string; opts?: Record<string, any> }

/**
 * 
 */
export class FSFileWriter {

    private fsStoreClient: FSStoreClient;

    constructor() {
        this.fsStoreClient = new FSStoreClient();
    }

    public async write(data: Buffer, options: ActionOptionsType): Promise<string> {

        return new Promise((resolve, reject) => {
            const reqId = this.fsStoreClient
                .getAccess(options,
                    async (filePath: string) => {
                        await appendFile(filePath, data, options.opts);
                        this.fsStoreClient.release(reqId);
                        resolve(filePath);
                    });
        });
    }

    public async append(data: Buffer, options: ActionOptionsType): Promise<string> {

        return new Promise((resolve, reject) => {
            const reqId = this.fsStoreClient
                .getAccess(options,
                    async (filePath: string) => {
                        await writeFile(filePath, data, options.opts);
                        this.fsStoreClient.release(reqId);
                        resolve(filePath);
                    });
        });
    }

    public async unlink(fileName: string): Promise<string> {

        return new Promise((resolve, reject) => {
            const reqId = this.fsStoreClient
                .getUnlink(
                    { fileName },
                    async (filePath: string) => {
                        await unlink(filePath);
                        this.fsStoreClient.release(reqId);
                        resolve(filePath);
                    },
                );
        });
    }
}
