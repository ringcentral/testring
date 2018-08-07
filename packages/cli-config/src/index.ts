import { IConfig } from '@testring/types';
import { getArguments } from './arguments-parser';
import { getFileConfig } from './config-file-reader';
import { defaultConfiguration } from './default-config';
import { mergeConfigs } from './merge-configs';

const getConfig = async (argv: Array<string> = []): Promise<IConfig> => {
    const args = getArguments(argv);

    const temporaryConfig = mergeConfigs(
        defaultConfiguration,
        args || {}
    );

    const fileConfig = await getFileConfig(temporaryConfig.config, temporaryConfig);
    const envConfig = await getFileConfig(temporaryConfig.envConfig, temporaryConfig);

    return mergeConfigs(
        defaultConfiguration,
        fileConfig || {},
        envConfig || {},
        args || {}
    );
};

export { defaultConfiguration, getConfig };
