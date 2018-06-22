import * as fs from 'fs';
import * as path from 'path';
import { IConfig } from '@testring/typings';

const findFile = (configPath) => {
    const filePath = path.resolve(configPath);
    const configExists = fs.existsSync(filePath);

    if (configExists) {
        return fs.readFileSync(filePath, { encoding: 'utf8' });
    }

    return null;
};

const readJSConfig = async (userConfig: IConfig): Promise<IConfig | null> => {
    try {
        const configFile = require(userConfig.config);

        if (typeof configFile === 'function') {
            return await configFile(userConfig);
        } else {
            return configFile;
        }
    } catch (exception) {
        throw new SyntaxError(`
            Config file ${userConfig.config} can't be parsed: invalid JS.
            ${exception.message}
        `);
    }
};

const readJSONConfig = async (userConfig: IConfig): Promise<IConfig | null> => {
    const fileContent = findFile(userConfig.config);

    if (fileContent === null) {
        return null;
    }

    try {
        return JSON.parse(fileContent);
    } catch (exception) {
        throw new SyntaxError(`
            Config file ${userConfig.config} can't be parsed: invalid JSON.
            ${exception.message}
        `);
    }
};

export const getFileConfig = async (userConfig: IConfig) => {
    const extension = path.extname(userConfig.config);

    switch (extension) {
        case '.js' :
            return readJSConfig(userConfig);
        case '.json' :
            return readJSONConfig(userConfig);
        default:
            throw new Error(`${extension} is not supported`);
    }
};
