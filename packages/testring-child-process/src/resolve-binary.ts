import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';

const IS_WIN = process.platform === 'win32';

const findNodeModulesDir = (modulePath: string) => {
    if (modulePath === '/') {
        throw new Error('There is no any node_module directory!');
    }

    if (modulePath.endsWith('node_modules')) {
        return modulePath;
    }

    return findNodeModulesDir(path.dirname(modulePath));
};

function windowsQuotes(str) {
    if (!/ /.test(str)) {
        return str;
    }

    return '"' + str + '"';
}

function escapify(str) {
    if (IS_WIN) {
        return path.normalize(str).split(/\\/).map(windowsQuotes).join('\\\\');
    } else if (/[^-_.~/\w]/.test(str)) {
        return '\'' + str.replace(/'/g, '\'"\'"\'') + '\'';
    } else {
        return str;
    }
}

export const resolveBinary = (name: string) => {
    const modulePath = require.resolve(name);
    const nodeModules = findNodeModulesDir(modulePath);
    const binaryPath = path.join(nodeModules, '.bin', name) + (IS_WIN ? '.cmd' : '');

    if (!fs.existsSync(binaryPath)) {
        throw new ReferenceError(`Package ${name} is existing, but it doesn't have bin`);
    }

    return escapify(binaryPath);
};
