import * as fs from 'fs';
import * as path from 'path';
import process from 'node:process';
import {loggerClient} from '@testring/logger';
import {requirePackage} from '@testring/utils';
import {IConfig as BaseConfig} from '@testring/types';
import {mergeConfigs} from './merge-configs';
import ProcessEnv = NodeJS.ProcessEnv;
interface IConfig extends BaseConfig {
    '@extend'?: string;
}


function findFile(configPath: string) {
    const filePath = path.resolve(configPath);
    const configExists = fs.existsSync(filePath);

    if (configExists) {
        return fs.readFileSync(filePath, {encoding: 'utf8'});
    }

    return null;
}

async function readJSConfig(
    configPath: string,
    config: IConfig,
    processEnv: ProcessEnv = process.env,
): Promise<IConfig | null> {
    try {
        const fullPath = path.resolve(configPath);
        const configFile = requirePackage(fullPath);

        if (typeof configFile === 'function') {
            // TODO (flops) write tests for env passing
            return await configFile(config, processEnv);
        }
        return configFile;
    } catch (exception) {
        const error = new SyntaxError(`
            Config file ${configPath} can't be parsed.
            ${exception instanceof Error ? exception.message : 'Unknown error'}
        `);

        if (exception instanceof Error && exception.stack) {
            error.stack = exception.stack;
        }

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
            ${exception instanceof Error ? exception.message : 'Unknown error'}
        `);
    }
}

async function readConfig(
    configPath: string | void,
    config: IConfig,
): Promise<IConfig | null> {
    if (!configPath) {
        return null;
    }

    const extension = path.extname(configPath);

    loggerClient.debug(`Read config file: ${configPath}`);

    let configData;

    switch (extension) {
        case '.js':
            configData = await readJSConfig(configPath, config);
            break;

        case '.json':
        case '':
            configData = await readJSONConfig(configPath);
            break;

        default:
            throw new Error(`${extension} is not supported`);
    }

    if (
        configData &&
        Object.prototype.hasOwnProperty.call(configData, '@extend')
    ) {
        const extendConfigPath = path.resolve(
            path.dirname(configPath),
            configData['@extend'] || '',
        );
        const extendConfig = (await readConfig(
            extendConfigPath,
            config,
        )) as Partial<IConfig>;

        if (extendConfig === null) {
            throw Error(`Config ${extendConfigPath} not found`);
        }

        configData = mergeConfigs(extendConfig, configData) as IConfig;
    }

    return configData;
}

export async function getFileConfig(
    configPath: string | void,
    userConfig: IConfig,
) {
    return await readConfig(configPath, userConfig);
}
