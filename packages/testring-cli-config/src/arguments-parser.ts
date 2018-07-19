import * as yargs from 'yargs';
import { IConfig } from '@testring/types';

const RESTRICTED_FIELDS = ['_', '$0', 'version', 'help'];

const normalize = (args: yargs.Arguments): Partial<IConfig> => {
    const normalizedArgs = {};

    let arg;

    for (let key in args) {
        // Removing unused fields from yargs
        if (RESTRICTED_FIELDS.includes(key)) {
            continue;
        }

        // Removing kebab-case fields in favor of camelCase
        // Config has both variants: 'test-field' and 'testField'
        if (key.includes('-')) {
            continue;
        }

        arg = args[key];

        if (arg === undefined) {
            continue;
        }

        normalizedArgs[key] = arg;
    }

    return normalizedArgs;
};

export const getArguments = (argv: Array<string>): Partial<IConfig> | null => {
    if (!argv) {
        return null;
    }

    const args = yargs.parse(argv);

    return normalize(args);
};
