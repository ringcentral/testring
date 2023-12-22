import {glob} from 'glob';

export function locateFiles(searchpath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        if (!searchpath) {
            return resolve([]);
        }

        glob(searchpath, {}).then((files) => {
            resolve(files);
        }).catch((error) => {
            reject(error);
        });
    });
}
