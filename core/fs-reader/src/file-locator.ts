import fg, { convertPathToPattern } from 'fast-glob';
import process from 'node:process';

export async function locateFiles(searchpath: string): Promise<string[]> {
    if (!searchpath) {
        return [];
    }
    if (process.platform === 'win32') {
        searchpath = convertPathToPattern(searchpath);
    }
    return await fg(searchpath, {});
}
