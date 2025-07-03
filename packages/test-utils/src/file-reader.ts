import * as path from 'path';
import * as fs from 'fs';

export const fileResolverFactory = (...root: Array<string>) => {
    return (...file: Array<string>) => path.resolve(...root, ...file);
};

export const fileReaderFactory = (...root: Array<string>) => {
    const resolver = fileResolverFactory(...root);

    return (source: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            fs.readFile(
                resolver(source),
                'utf8',
                (err: NodeJS.ErrnoException | null, file: string) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(file);
                    }
                },
            );
        });
    };
};
