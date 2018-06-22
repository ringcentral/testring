import * as fs from 'fs';
import * as path from 'path';

export const fileResolverFactory = (...root: Array<string>) => {
    return (...file: Array<string>) => path.resolve(...root, ...file);
};

export const fileReaderFactory = (...root: Array<string>) => {
    const resolver = fileResolverFactory(...root);

    return (source: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            fs.readFile(resolver(source), 'utf8', (err: Error, file: string) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(file);
                }
            });
        });
    };
};
