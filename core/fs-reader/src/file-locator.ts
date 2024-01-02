import * as fg from 'fast-glob';

export function locateFiles(searchpath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        if (!searchpath) {
            return resolve([]);
        }

        let patternInternal = fg.convertPathToPattern(searchpath);
        console.log('patternInternal', patternInternal);
        fg.async(patternInternal).then((files) => {
            resolve(files);
        }).catch((error) => {
            reject(error);
        });
    });
}
