import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';
import { loggerClient } from '@testring/logger';
import { requirePackage } from '@testring/utils';
import { IConfig } from '@testring/types';

function findFile(configPath: string) {
    const filePath = path.resolve(configPath);
    const configExists = fs.existsSync(filePath);

    if (configExists) {
        return fs.readFileSync(filePath, { encoding: 'utf8' });
    }

    return null;
}

async function readJSConfig(configPath: string, config: IConfig): Promise<IConfig | null> {
    try {
        const fullPath = path.resolve(configPath);
        const configFile = requirePackage(fullPath);

        if (typeof configFile === 'function') {
            // TODO move process.env outside function
            // TODO write tests for env passing
            return await configFile(config, process.env);
        } else {
            return configFile;
        }
    } catch (exception) {
        const error = new SyntaxError(`
            Config file ${configPath} can't be parsed.
            ${exception.message}
        `);

        error.stack = exception.stack;

        throw error;
    }
}

async function readJSONConfig(configPath: string): Promise<IConfig | null> {
    const fileContent = findFile(configPath);

    if (fileContent === null) {
        return null;
    }

    try {
        return JSON.parse(fileContent);
    } catch (exception) {
        throw new SyntaxError(`
            Config file ${configPath} can't be parsed: invalid JSON.
            ${exception.message}
        `);
    }
}


async function readConfig(
    configPath: string | void,
    config: IConfig
): Promise<IConfig | null> {

    if (!configPath) {
        return null;
    }

    const extension = path.extname(configPath);

    loggerClient.debug(`Read config file: ${configPath}`);

    switch (extension) {
        case '.js':
            return readJSConfig(configPath, config);

        case '.json':
        case '':
            return readJSONConfig(configPath);

        default:
            throw new Error(`${extension} is not supported`);
    }
}

export async function getFileConfig(configPath: string | void, userConfig: IConfig) {
    return await readConfig(configPath, userConfig);
}
