import * as fs from 'fs';
import * as path from 'path';

import * as utils from './utils';
import { FSStoreClient } from './fs-store-client';

const { writeFile, appendFile, unlink } = fs.promises;

type ILog = { debug: ((string) => void); error: ((string) => void) }

export type ActionOptionsType = { path?: string; fileName: string; opts?: Record<string, any> }
    | { path: string; fileName?: string; opts?: Record<string, any> }

export class FSFileWriter {

    private fsStoreClient: FSStoreClient;

    constructor(private logger: ILog, prefix: string = utils.FS_CONSTANTS.FS_DEFAULT_MSG_PREFIX) {
        this.fsStoreClient = new FSStoreClient(prefix);
    }

    public async write(data: Buffer, options: ActionOptionsType): Promise<string> {

        return new Promise((resolve, reject) => {
            const reqId = this.fsStoreClient
                .getAccess({ ...options, ext: options.opts?.ext as string | undefined },
                    async (filePath: string) => {
                        try {
                            await utils.fs.ensureDir(path.dirname(filePath));
                            await writeFile(filePath, data, options.opts);
                        } catch (e) {
                            this.logger.error('could not write to ' + filePath);
                        }
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
                        try {
                            await utils.fs.ensureDir(path.dirname(filePath));
                            await appendFile(filePath, data, options.opts);
                        } catch (e) {
                            this.logger.error('could not append to ' + filePath);
                        }
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
                        try {
                            await unlink(filePath);
                        } catch (e) {
                            this.logger.error('could not delete ' + filePath);
                        }
                        this.fsStoreClient.release(reqId);
                        resolve(filePath);
                    },
                );
        });
    }
}
