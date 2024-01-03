import {RemoteOptions} from 'webdriverio';

export type SeleniumPluginConfig = RemoteOptions & {
    chromeDriverPath?: string;
    recorderExtension: boolean;
    clientCheckInterval: number;
    clientTimeout: number;
    host?: string; // fallback for configuration. In WebdriverIO 5 field host renamed to hostname
    desiredCapabilities?: WebdriverIO.Capabilities[];// fallback for configuration. In WebdriverIO 5 field renamed
    cdpCoverage: boolean;
};
