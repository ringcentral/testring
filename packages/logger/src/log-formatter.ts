import * as process from 'process';
import * as util from 'util';
import * as bytes from 'bytes';
import { default as chalk } from 'chalk';
import {
    ILogEntity,
    LogLevel,
    LogTypes
} from '@testring/types';

const HAS_EMOJI_SUPPORT = process.stdout.isTTY && process.platform === 'darwin';

const textTemplate = (logLevel: LogLevel) => `[${logLevel}]`.padEnd(9);

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

const formatLogLevel = (logLevel: LogLevel): string => {
    const template = HAS_EMOJI_SUPPORT ?
        emojiTemplate(logLevel) :
        textTemplate(logLevel);

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

export const formatLog = (
    logEntity: ILogEntity
): string => {
    const formattedPrefix = `${formatTime(logEntity.time)} | ${formatLogLevel(logEntity.logLevel)}`;

    switch (logEntity.type) {
        case LogTypes.media: {
            const filename = logEntity.content[0];
            const media = logEntity.content[1];

            return util.format(
                formattedPrefix, '[media]',
                `Filename: ${filename};`,
                `Size: ${bytes.format(media ? media.length : 0)};`
            );
        }

        case LogTypes.step: {
            return util.format(formattedPrefix, '[step]', ...logEntity.content);
        }

        default:
            return util.format(formattedPrefix, ...logEntity.content);
    }
};
