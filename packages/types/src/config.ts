import { PluginConfig } from './plugin';

export type ScreenshotsConfig = 'disabled' | 'enabled' | 'afterError';

export type ConfigPluginDescriptor = string | [string, PluginConfig];

export interface IConfig {
    screenshots: ScreenshotsConfig;
    config: string;
    debug: boolean;
    silent: boolean;
    bail: boolean;
    workerLimit: number;
    retryCount: number;
    retryDelay: number;
    tests: string;
    httpThrottle: number;
    logLevel: string;
    envConfig?: string;
    envParameters?: any;
    plugins?: Array<ConfigPluginDescriptor>;
}
