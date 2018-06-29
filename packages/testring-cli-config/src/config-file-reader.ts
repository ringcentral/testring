import * as fs from 'fs';
import * as path from 'path';
import {loggerClientLocal} from '@testring/logger';
import { IConfig } from '@testring/types';

const findFile = (configPath: string) => {
    const filePath = path.resolve(configPath);
    const configExists = fs.existsSync(filePath);

    if (configExists) {
        return fs.readFileSync(filePath, { encoding: 'utf8' });
    }

    return null;
};

const readJSConfig = async (configPath: string, config: IConfig): Promise<IConfig | null> => {
    try {
        const configFile = require(configPath);

        if (typeof configFile === 'function') {
            return await configFile(config);
        } else {
            return configFile;
        }
    } catch (exception) {
        throw new SyntaxError(`
            Config file ${configPath} can't be parsed: invalid JS.
            ${exception.message}
        `);
    }
};

const readJSONConfig = async (configPath: string): Promise<IConfig | null> => {
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
};


const readConfig = async (
        configPath: string | void,
        config: IConfig,
    ): Promise<IConfig | null> => {
  
    if (!configPath) {
        return null;
    }

    const extension = path.extname(configPath);
    loggerClientLocal.log(`Read config file: ${configPath}`);

    switch (extension) {
        case '.js' :
            return readJSConfig(configPath, config);
        case '.json' :
            return readJSONConfig(configPath);
        default:
            throw new Error(`${extension} is not supported`);
    }
};

export const getFileConfig = async (userConfig: IConfig) => {
    return await readConfig(userConfig.config, userConfig);
};

export const getEnvConfig = async (userConfig: IConfig) => {
    return await readConfig(userConfig.envConfig, userConfig);
};
