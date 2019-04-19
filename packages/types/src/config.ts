import { PluginConfig } from './plugin';
import { LogLevel } from './logger/enums';

export type ScreenshotsConfig = 'disable' | 'enable' | 'afterError';

export type RestartWorkerConfig = 'never' | 'always';

export type ConfigPluginDescriptor = string | [string, PluginConfig];

export interface IConfigLogger {
    logLevel: LogLevel;
    silent: boolean;
}

export interface IConfig extends IConfigLogger {
    // TODO make configurable
    devtool: boolean;
    restartWorker: RestartWorkerConfig;
    screenshots: ScreenshotsConfig;
    config: string;
    debug: boolean;
    bail: boolean;
    workerLimit: number | 'local';
    retryCount: number;
    retryDelay: number;
    testTimeout: number;
    tests: string;
    envConfig?: string;
    envParameters?: any;
    plugins: Array<ConfigPluginDescriptor>;
    httpThrottle: number;
}
