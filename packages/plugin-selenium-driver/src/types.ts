import { Config } from 'webdriverio';

export type SeleniumPluginConfig = WebdriverIO.RemoteOptions & Config & {
    chromeDriverPath?: string;
    recorderExtension: boolean;
    clientCheckInterval: number;
    clientTimeout: number;
};
