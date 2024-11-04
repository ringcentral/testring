import * as fg from 'fast-glob';
import * as process from 'node:process';

export async function locateFiles(searchpath: string): Promise<string[]> {
    if(!searchpath) {
        return [];
    }
    if (process.platform === 'win32') {
        searchpath = fg.convertPathToPattern(searchpath);
    }
    return await fg(searchpath, {});
}