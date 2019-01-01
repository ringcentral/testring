import * as yargs from 'yargs';
import { IConfig } from '@testring/types';

const RESTRICTED_FIELDS = ['_', '$0', 'version', 'help'];

const firstLetterToUpperCase = (matches): string => matches[1].toUpperCase();
const toCamelCase = (string: string): string => string.replace(/(-\w)/g, firstLetterToUpperCase);


function normalizeArg(arg: any): any {
    switch (typeof arg) {
        case 'object':
            if (!Array.isArray(arg) && arg !== null) {
                // eslint-disable-next-line no-use-before-define
                return normalize(arg, false);
            } else {
                return arg;
            }

        default:
            return arg;
    }
}


function normalize(args: yargs.Arguments, isRoot: boolean): Partial<IConfig> {
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
}


export function getArguments(argv: Array<string>): Partial<IConfig> | null {
    if (!argv) {
        return null;
    }

    const args = yargs.parse(argv);

    return normalize(args, true);
}
