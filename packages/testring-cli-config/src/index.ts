import * as deepmerge from 'deepmerge';
import { IConfig } from '@testring/types';
import { getArguments } from './arguments-parser';
import { getFileConfig } from './config-file-reader';
import { defaultConfiguration } from './default-config';

export const getConfig = async (argv: Array<string>): Promise<IConfig> => {
    const args = getArguments(argv);

    const temporaryConfig = deepmerge.all<IConfig>([
        defaultConfiguration,
        args || {}
    ]);

    const fileConfig = await getFileConfig(temporaryConfig);

    return deepmerge.all<IConfig>([
        defaultConfiguration,
        fileConfig || {},
        args || {}
    ]);
};
