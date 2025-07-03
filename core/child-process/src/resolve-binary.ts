import * as fs from 'fs';
import * as path from 'path';
import process from 'node:process';

const IS_WIN = process.platform === 'win32';

function findNodeModulesDir(modulePath: string) {
    if (modulePath === '/') {
        throw new Error('There is no any node_module directory!');
    }

    if (modulePath.endsWith('node_modules')) {
        return modulePath;
    }

    return findNodeModulesDir(path.dirname(modulePath));
}

function windowsQuotes(str: string): string {
    if (!/ /.test(str)) {
        return str;
    }

    return '"' + str + '"';
}

function escapify(str: string) {
    if (IS_WIN) {
        return path.normalize(str).split(/\\/).map(windowsQuotes).join('\\\\');
    } else if (/[^-_.~/\w]/.test(str)) {
        return "'" + str.replace(/'/g, "'\"'\"'") + "'";
    }
    return str;
}

export function resolveBinary(name: string): string {
    const modulePath = require.resolve(name);
    const nodeModules = findNodeModulesDir(modulePath);
    const binaryPath =
        path.join(nodeModules, '.bin', name) + (IS_WIN ? '.cmd' : '');

    if (!fs.existsSync(binaryPath)) {
        throw new ReferenceError(
            `Package ${name} is existing, but it doesn't have bin`,
        );
    }

    return escapify(binaryPath);
}
