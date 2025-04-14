import {Capabilities} from '@wdio/types';

export type SeleniumPluginConfig = Capabilities.WebdriverIOConfig & {
    chromeDriverPath?: string;
    recorderExtension: boolean;
    clientCheckInterval: number;
    clientTimeout: number;
    host?: string; // fallback for configuration. In WebdriverIO 5 field host renamed to hostname
    desiredCapabilities?: Capabilities.RequestedStandaloneCapabilities[]; // fallback for configuration. In WebdriverIO 5 field renamed
    cdpCoverage: boolean;
    workerLimit?: number | 'local';
    disableClientPing?: boolean;
    delayAfterSessionClose?: number;
};
