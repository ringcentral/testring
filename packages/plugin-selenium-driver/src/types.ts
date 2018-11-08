import { Config } from 'webdriverio';

export type SeleniumPluginConfig = Config & {
    clientCheckInterval: number;
    clientTimeout: number;
};
