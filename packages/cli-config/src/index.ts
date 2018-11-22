import * as inspector  from 'inspector';
import { IConfig } from '@testring/types';
import { getArguments } from './arguments-parser';
import { getFileConfig } from './config-file-reader';
import { defaultConfiguration } from './default-config';
import { mergeConfigs } from './merge-configs';

const isDebugging = () => !!inspector.url();

const getConfig = async (argv: Array<string> = []): Promise<IConfig> => {
    const args = getArguments(argv);
    const debugProperty =  { debug: isDebugging() };

    const temporaryConfig = mergeConfigs(
        defaultConfiguration,
        args || {},
        debugProperty,
    );

    const fileConfig = await getFileConfig(temporaryConfig.config, temporaryConfig);
    const envConfig = await getFileConfig(temporaryConfig.envConfig, temporaryConfig);

    return mergeConfigs(
        defaultConfiguration,
        envConfig || {},
        fileConfig || {},
        args || {},
        debugProperty,
    );
};

export { defaultConfiguration, getConfig };
