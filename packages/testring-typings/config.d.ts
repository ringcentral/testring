import { PluginConfig } from './plugin';

export type ConfigPluginDescriptor = string | [string, PluginConfig];

export interface IConfig {
    config: string,
    report: string,
    debug: boolean,
    silent: boolean,
    verbose: boolean,
    workerLimit: number,
    retryCount: number,
    retryDelay: number,
    tests: string,
    httpThrottle: number,
    plugins?: Array<ConfigPluginDescriptor>
}
