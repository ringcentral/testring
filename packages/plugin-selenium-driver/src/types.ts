import { Config } from 'webdriverio';

export type SeleniumPluginConfig = Config & {
    chromeDriverPath?: string;
    recorderExtension: boolean;
    clientCheckInterval: number;
    clientTimeout: number;
};
