import { mkdir } from 'fs';

export async function ensureDir(savePath: string) {
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
