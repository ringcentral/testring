import * as fs from 'fs';

const { mkdir, promises } = fs;
const { open } = promises;

async function ensureDir(savePath: string) {
  return new Promise((resolve, reject) => {
    mkdir(savePath, { recursive: true }, (err) => {
      if (err && err.code !== 'EEXIST') {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}

async function touchFile(fName: string) {
  return open(fName, 'a+').then(fHandle => fHandle.close());
}

export { ensureDir, touchFile };