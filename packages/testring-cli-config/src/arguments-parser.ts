import * as yargs from 'yargs';
import { IConfig } from '@testring/types';

const RESTRICTED_FIELDS = ['_', '$0', 'version', 'help'];

const normalize = (args: yargs.Arguments): IConfig => {
    const normalizedArgs = {};

    let arg;

    for (let key in args) {
        if (RESTRICTED_FIELDS.includes(key)) {
            continue;
        }

        arg = args[key];

        if (arg === undefined) {
            continue;
        }

        normalizedArgs[key] = arg;
    }

    return normalizedArgs as IConfig;
};

export const getArguments = (argv: Array<string>): IConfig | null => {
    if (!argv) {
        return null;
    }

    const args = yargs.parse(argv);

    return normalize(args);
};
