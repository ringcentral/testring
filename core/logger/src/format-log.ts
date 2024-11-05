import * as process from 'process';
import * as util from 'util';
import * as chalk from 'chalk';
import {ILogEntity, LogLevel, LogTypes} from '@testring/types';

const HAS_EMOJI_SUPPORT = !!(
    process.stdout.isTTY && process.platform === 'darwin'
);

const textTemplate = (logLevel: LogLevel) => logLevel.padEnd(9);

function emojiTemplate(logLevel: LogLevel) {
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
}

function formatLogLevel(logLevel: LogLevel, emojiSupport: boolean): string {
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
}

const formatTime = (time: Date) => chalk.grey(`${time.toLocaleTimeString()}`);

const formatProcessID = (processID?: string) =>
    typeof processID === 'string' ? processID.padEnd(10) : 'main';

export function formatLog(
    logEntity: ILogEntity,
    processID?: string,
    emojiSupport: boolean = HAS_EMOJI_SUPPORT,
): string {
    const formattedPrefix =
        // eslint-disable-next-line max-len
        `${formatTime(logEntity.time)} | ${formatLogLevel(
            logEntity.logLevel,
            emojiSupport,
        )} | ${formatProcessID(processID)} |`;
    const prefixes = logEntity.prefix ? [logEntity.prefix] : [];

    switch (logEntity.type) {
        case LogTypes.screenshot: {
            const filename = logEntity.content[0];
            prefixes.push('[screenshot]');

            return util.format(
                formattedPrefix,
                ...prefixes,
                `Filename: ${filename};`,
            );
        }

        case LogTypes.step: {
            prefixes.push('[step]');
            return util.format(
                formattedPrefix,
                ...prefixes,
                ...logEntity.content,
            );
        }

        default:
            return util.format(
                formattedPrefix,
                ...prefixes,
                ...logEntity.content,
            );
    }
}
