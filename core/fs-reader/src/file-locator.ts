import {glob} from 'glob';

export function locateFiles(searchpath: string): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
        if (!searchpath) {
            return resolve([]);
        }
        try {
            const files = await glob(searchpath, {});
            resolve(files);
        } catch (error) {
            reject(error);
        }
    });
}
