import * as fg from 'fast-glob';

export function locateFiles(searchpath: string): Promise<string[]> {
    const searchPattern = searchpath && process.platform === 'win32' ? fg.convertPathToPattern(searchpath) : searchpath;
    return new Promise((resolve, reject) => {
        if (!searchpath) {
            return resolve([]);
        }

        fg.async(searchPattern).then((files) => {
            resolve(files);
        }).catch((error) => {
            reject(error);
        });
    });
}
