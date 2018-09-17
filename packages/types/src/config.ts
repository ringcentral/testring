import { PluginConfig } from './plugin';

export type ConfigPluginDescriptor = string | [string, PluginConfig];

export interface IConfig {
    config: string;
    debug: boolean;
    silent: boolean;
    bail: boolean;
    workerLimit: number;
    retryCount: number;
    retryDelay: number;
    testTimeout: number;
    tests: string;
    httpThrottle: number;
    logLevel: string;
    envConfig?: string;
    envParameters?: any;
    plugins?: Array<ConfigPluginDescriptor>;
}
