import { Config } from 'webdriverio';

export type SeleniumPluginConfig = WebdriverIO.RemoteOptions & Config & {
    chromeDriverPath?: string;
    recorderExtension: boolean;
    clientCheckInterval: number;
    clientTimeout: number;
    host?: string; // fallback for configuration. In WebdriverIO 5 field host renamed to hostname
    desiredCapabilities?: any; // fallback for configuration. In WebdriverIO 5 field renamed
};
