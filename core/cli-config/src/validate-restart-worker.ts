import {IConfig} from '@testring/types';

export function validateRestartWorker(config: IConfig): void {
    const {restartWorker} = config;

    if (
        typeof restartWorker === 'boolean' ||
        restartWorker === 'always'
    ) {
        return;
    }

    if (
        typeof restartWorker === 'number' &&
        Number.isInteger(restartWorker) &&
        restartWorker >= 0
    ) {
        return;
    }

    throw new Error(
        `Invalid "restartWorker" config value: ${JSON.stringify(restartWorker)}. ` +
            `Expected a boolean, a non-negative integer, or the string "always".`,
    );
}
