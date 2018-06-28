import * as fs from 'fs';
import * as path from 'path';
import { loggerClientLocal } from '@testring/logger';
import { ITestFile } from '@testring/types';

const ERR_NO_FILES = new Error('No test files found');

const isTestFile = (x: ITestFile | null): x is ITestFile => !!x;

const readTestFile = (file: string): Promise<ITestFile | null> => {
    const readPromise = new Promise<ITestFile>((resolve, reject) => {
        const filePath: string = path.resolve(file);

        if (fs.existsSync(filePath)) {
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    return reject(err);
                }

                return resolve({
                    path: filePath,
                    content: data.toString(),
                    meta: {}
                });
            });
        } else {
            reject(new Error(`file doesn't exist: ${filePath}`));
        }
    });

    return readPromise.catch((error) => {
        loggerClientLocal.error(error);

        return null;
    });
};

export const resolveTests = async (files: Array<string>): Promise<ITestFile[]> => {
    if (!files || files.length === 0) {
        throw ERR_NO_FILES;
    }

    const readFilePromises = files.map(readTestFile);
    const testFiles = await Promise.all(readFilePromises);
    const compacted = testFiles.filter(isTestFile);

    if (compacted.length === 0) {
        throw ERR_NO_FILES;
    }

    return compacted;
};
