import {Capabilities} from '@wdio/types';

export type SeleniumVersion = 'v3' | 'v4';

export type SeleniumPluginConfig = Capabilities.WebdriverIOConfig & {
    chromeDriverPath?: string;
    recorderExtension: boolean;
    clientCheckInterval: number;
    clientTimeout: number;
    host?: string; // fallback for configuration. In WebdriverIO 5 field host renamed to hostname
    desiredCapabilities?: Capabilities.RequestedStandaloneCapabilities[]; // fallback for configuration. In WebdriverIO 5 field renamed
    workerLimit?: number | 'local';
    disableClientPing?: boolean;
    delayAfterSessionClose?: number;
    localVersion?: SeleniumVersion;
    seleniumArgs?: string[]; // Additional CLI arguments to pass to Selenium server
};
