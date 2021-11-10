import * as fs from 'fs';

const {mkdir, promises} = fs;
const {open, access} = promises;

function ensureDir(savePath: string) {
    return new Promise((resolve, reject) => {
        mkdir(savePath, {recursive: true}, (err) => {
            if (err && err.code !== 'EEXIST') {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}

function touchFile(fName: string) {
    return open(fName, 'a+').then((fHandle) => fHandle.close());
}

function ensureNewFile(fName: string) {
    return open(fName, 'ax')
        .then((fHandle) => fHandle.close())
        .then(() => true)
        .catch((e) => false);
}

async function exists(path: string) {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
}

export {ensureDir, touchFile, exists, ensureNewFile};
