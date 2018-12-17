import * as fs from 'fs';
import * as path from 'path';
import { IFile } from '@testring/types';

const ERR_NO_FILES = new Error('No test files found');

const isNotEmpty = (x: IFile | null): x is IFile => x !== null;

export const readFile = (file: string): Promise<IFile | null> => {
    return new Promise<IFile>((resolve, reject) => {
        const filePath: string = path.resolve(file);

        if (fs.existsSync(filePath)) {
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    return reject(err);
                }

                return resolve({
                    path: filePath,
                    content: data.toString(),
                });
            });
        } else {
            reject(new Error(`File doesn't exist: ${filePath}`));
        }
    });
};

export const resolveFiles = async (files: Array<string>): Promise<IFile[]> => {
    if (!files || files.length === 0) {
        throw ERR_NO_FILES;
    }

    const readFilePromises = files.map(file => readFile(file).catch(() => null));
    const filesContent = await Promise.all(readFilePromises);
    const compacted = filesContent.filter(isNotEmpty);

    if (compacted.length === 0) {
        throw ERR_NO_FILES;
    }

    return compacted;
};
