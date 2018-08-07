import * as yargs from 'yargs';
import { IConfig } from '@testring/types';

const RESTRICTED_FIELDS = ['_', '$0', 'version', 'help'];

const trimString = (string: string): string => string.trim();
const firstLetterToUpperCase = (matches) => matches[1].toUpperCase();
const toCamelCase = (string: string): string => string.replace(
    /(-\w)/g,
    firstLetterToUpperCase
);

const normalizeArg = (arg: any): any => {
    switch (typeof arg) {
        case 'object':
            if (!Array.isArray(arg) && arg !== null) {
                return normalize(arg, false);
            } else {
                return arg;
            }

        case 'string':
            if (arg.includes(',')) {
                return arg.split(',').map(trimString);
            } else {
                return arg;
            }

        default:
            return arg;
    }
};

const normalize = (args: yargs.Arguments, isRoot: boolean): Partial<IConfig> => {
    const normalizedArgs = {};

    let arg;

    for (let key in args) {
        // Removing unused fields from yargs
        if (RESTRICTED_FIELDS.includes(key)) {
            continue;
        }

        arg = normalizeArg(args[key]);

        if (arg === undefined) {
            continue;
        }

        // Removing kebab-case fields in favor of camelCase
        // Config has both variants: 'test-field' and 'testField'
        if (key.includes('-')) {
            if (typeof arg === 'object' || !isRoot) {
                normalizedArgs[toCamelCase(key)] = arg;
            }

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

    return normalize(args, true);
};
