import { PluginConfig } from './plugin';

export type ConfigPluginDescriptor = string | [string, PluginConfig];

export interface IConfig {
    config: string,
    report: string,
    debug: boolean,
    silent: boolean,
    bail: boolean,
    workerLimit: number,
    retryCount: number,
    retryDelay: number,
    tests: string,
    httpThrottle: number,
    logLevel: string,
    envConfig?: string,
    plugins?: Array<ConfigPluginDescriptor>
}
