import { PluginConfig } from './plugin';

export type ScreenshotsConfig = 'disable' | 'enable' | 'afterError';

export type RestartWorkerConfig = 'never' | 'always';

export type ConfigPluginDescriptor = string | [string, PluginConfig];

export interface IConfig {
    recorder: boolean;
    restartWorker: RestartWorkerConfig;
    screenshots: ScreenshotsConfig;
    config: string;
    debug: boolean;
    silent: boolean;
    bail: boolean;
    workerLimit: number | 'local';
    retryCount: number;
    retryDelay: number;
    testTimeout: number;
    tests: string;
    logLevel: string;
    envConfig?: string;
    envParameters?: any;
    plugins: Array<ConfigPluginDescriptor>;
    httpThrottle: number;
}
