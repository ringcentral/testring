import { Config } from 'webdriverio';

export type SeleniumPluginConfig = Config & {
    recorderExtension: boolean;
    clientCheckInterval: number;
    clientTimeout: number;
};
