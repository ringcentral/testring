import * as fs from 'fs';
import * as path from 'path';
import {IFile} from '@testring/types';

// p-limit has been ESM-only since v4; this package's tsconfig targets
// CommonJS output, so a plain `import`/`require()` can't load it. Loading
// it via a string-wrapped dynamic import keeps the real ESM `import()`
// intact at runtime instead of letting tsc downlevel it to `require()` —
// the same technique `@testring/test-worker`'s worker-controller uses to
// load native ESM test files.
const dynamicImport: (specifier: string) => Promise<unknown> = new Function(
    'specifier',
    'return import(specifier);',
) as (specifier: string) => Promise<unknown>;

let pLimitModulePromise: Promise<typeof import('p-limit')> | null = null;

function importPLimit(): Promise<typeof import('p-limit')> {
    if (pLimitModulePromise === null) {
        pLimitModulePromise = dynamicImport('p-limit') as Promise<
            typeof import('p-limit')
        >;
    }

    return pLimitModulePromise;
}

const ERR_NO_FILES = new Error('No test files found');

const isNotEmpty = (x: IFile | null): x is IFile => x !== null;

export function readFile(file: string): Promise<IFile | null> {
    return new Promise<IFile>((resolve, reject) => {
        const filePath: string = path.resolve(file);

        if (fs.existsSync(filePath)) {
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    return reject(err);
                }

                return resolve({
                    path: filePath,
                    content: data.toString(),
                });
            });
        } else {
            reject(new Error(`File doesn't exist: ${filePath}`));
        }
    });
}

export async function resolveFiles(files: Array<string>): Promise<IFile[]> {
    if (!files || files.length === 0) {
        throw ERR_NO_FILES;
    }

    const {default: pLimit} = await importPLimit();
    const limit = pLimit(10);

    // Limit concurrent file reads
    const readFilePromises = files.map((file) =>
        limit(() => readFile(file).catch(() => null)),
    );

    const filesContent = await Promise.all(readFilePromises);
    const compacted = filesContent.filter(isNotEmpty);

    if (compacted.length === 0) {
        throw ERR_NO_FILES;
    }

    return compacted;
}
