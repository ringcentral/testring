import * as path from 'path';
import {register} from 'node:module';
import {pathToFileURL} from 'node:url';

let registered = false;

export function registerEsmLoaderHooks(): void {
    if (registered) {
        return;
    }

    registered = true;

    const implUrl = pathToFileURL(
        path.join(__dirname, 'esm-loader-hooks-impl.mjs'),
    ).href;

    register(implUrl, {
        parentURL: pathToFileURL(__filename).href,
    });
}
