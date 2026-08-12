import * as inspector from 'inspector';
import {IConfig} from '@testring/types';
import {getArguments} from './arguments-parser';
import {getFileConfig} from './config-file-reader';
import {defaultConfiguration} from './default-config';
import {mergeConfigs} from './merge-configs';
import {validateRestartWorker} from './validate-restart-worker';

const isDebugging = () => !!inspector.url();

async function getConfig(argv: Array<string> = []): Promise<IConfig> {
    const args = getArguments(argv);
    const debugProperty = {debug: isDebugging()};

    const temporaryConfig = mergeConfigs(
        defaultConfiguration,
        args || {},
        debugProperty,
    );

    const envConfig = await getFileConfig(
        temporaryConfig.envConfig,
        temporaryConfig,
    );
    const fileConfig = await getFileConfig(
        temporaryConfig.config,
        temporaryConfig,
    );

    const config = mergeConfigs(
        defaultConfiguration,
        envConfig || {},
        fileConfig || {},
        args || {},
        debugProperty,
    );

    validateRestartWorker(config);

    return config;
}

export {defaultConfiguration, getConfig};
