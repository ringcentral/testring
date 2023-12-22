import * as fg from 'fast-glob';

export function locateFiles(searchpath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        if (!searchpath) {
            return resolve([]);
        }

        fg.async(fg.convertPathToPattern(searchpath)).then((files) => {
            resolve(files);
        }).catch((error) => {
            reject(error);
        });
    });
}
