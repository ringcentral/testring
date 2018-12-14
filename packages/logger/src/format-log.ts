import * as process from 'process';
import * as util from 'util';
import * as bytes from 'bytes';
import { default as chalk } from 'chalk';
import {
    ILogEntity,
    LogLevel,
    LogTypes
} from '@testring/types';

const HAS_EMOJI_SUPPORT: boolean = !!(process.stdout.isTTY && process.platform === 'darwin');

const textTemplate = (logLevel: LogLevel) => logLevel.padEnd(9);

const emojiTemplate = (logLevel: LogLevel) => {
    switch (logLevel) {
        case LogLevel.info:
            return 'ℹ';

        case LogLevel.debug:
            return '🔍';

        case LogLevel.warning:
            return '⚠';

        case LogLevel.error:
            return '✖';

        case LogLevel.verbose:
            return '🔈';

        case LogLevel.silent:
            return '';
    }
};

const formatLogLevel = (logLevel: LogLevel, emojiSupport: boolean): string => {
    const template = emojiSupport
        ? emojiTemplate(logLevel)
        : textTemplate(logLevel);

    switch (logLevel) {
        case LogLevel.info:
            return chalk.blue(template);

        case LogLevel.debug:
            return chalk.bold(template);

        case LogLevel.warning:
            return chalk.yellow(template);

        case LogLevel.error:
            return chalk.red(template);

        case LogLevel.verbose:
            return chalk.gray(template);

        case LogLevel.silent:
            return chalk.white(template);
    }
};

const formatTime = (time: Date) => chalk.grey(`${time.toLocaleTimeString()}`);

const formatProcessID = (processID?: string) => typeof processID === 'string' ? processID.padEnd(10) : 'main';

export const formatLog = (
    logEntity: ILogEntity,
    processID?: string,
    emojiSupport: boolean = HAS_EMOJI_SUPPORT,
): string => {
    const formattedPrefix = (
        // eslint-disable-next-line max-len
        `${formatTime(logEntity.time)} | ${formatLogLevel(logEntity.logLevel, emojiSupport)} | ${formatProcessID(processID)} |`
    );
    let prefixes = logEntity.prefix ? [logEntity.prefix] : [];

    switch (logEntity.type) {
        case LogTypes.media: {
            const filename = logEntity.content[0];
            const media = logEntity.content[1];
            prefixes.push('[media]');

            return util.format(
                formattedPrefix, ...prefixes,
                `Filename: ${filename};`,
                `Size: ${bytes.format(media ? media.length : 0)};`
            );
        }

        case LogTypes.step: {
            prefixes.push('[step]');
            return util.format(formattedPrefix, ...prefixes, ...logEntity.content);
        }

        default:
            return util.format(formattedPrefix, ...prefixes, ...logEntity.content);
    }
};
