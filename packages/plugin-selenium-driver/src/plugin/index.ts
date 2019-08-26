import { SeleniumPluginConfig } from '../types';
import { IBrowserProxyPlugin, WindowFeaturesConfig } from '@testring/types';
import GraphemeSplitter from 'grapheme-splitter';

import { ChildProcess } from 'child_process';

import { Config, Client, RawResult, remote } from 'webdriverio';
import * as deepmerge from 'deepmerge';

import { spawn } from '@testring/child-process';
import { loggerClient } from '@testring/logger';
import { absoluteExtensionPath } from '@testring/devtool-extension';

type browserClientItem = {
    client: Client<any>;
    sessionId: string;
    initTime: number;
};

const DEFAULT_CONFIG: SeleniumPluginConfig = {
    recorderExtension: false,
    deprecationWarnings: false,
    clientCheckInterval: 5 * 1000,
    clientTimeout: 15 * 60 * 1000,
    port: 4444,
    desiredCapabilities: {
        browserName: 'chrome',
        chromeOptions: { // for local ChromeDriver
            args: [],
        },
    },
};

function waitFor(client: Client<any>) {
    return client.waitUntil(() => client.isExisting('body'), 10000);
}

function delay(timeout) {
    return new Promise<void>((resolve) => setTimeout(() => resolve(), timeout));
}

function stringifyWindowFeatures(windowFeatures: WindowFeaturesConfig) {
    let result;
    if (typeof windowFeatures === 'string') {
        result = windowFeatures;
    } else {
        result = Object.keys(windowFeatures)
            .map((key) => `${key}=${windowFeatures[key]}`)
            .join(',');
    }
    return result;
}

const UNICODE_CHARACTERS = {
    'NULL': '\uE000',
    'Unidentified': '\uE000',
    'Cancel': '\uE001',
    'Help': '\uE002',
    'Back space': '\uE003',
    'Backspace': '\uE003',
    'Tab': '\uE004',
    'Clear': '\uE005',
    'Return': '\uE006',
    'Enter': '\uE007',
    'Shift': '\uE008',
    'Control': '\uE009',
    'Control Left': '\uE009',
    'Control Right': '\uE051',
    'Alt': '\uE00A',
    'Pause': '\uE00B',
    'Escape': '\uE00C',
    'Space': '\uE00D',
    ' ': '\uE00D',
    'Pageup': '\uE00E',
    'PageUp': '\uE00E',
    'Page_Up': '\uE00E',
    'Pagedown': '\uE00F',
    'PageDown': '\uE00F',
    'Page_Down': '\uE00F',
    'End': '\uE010',
    'Home': '\uE011',
    'Left arrow': '\uE012',
    'Arrow_Left': '\uE012',
    'ArrowLeft': '\uE012',
    'Up arrow': '\uE013',
    'Arrow_Up': '\uE013',
    'ArrowUp': '\uE013',
    'Right arrow': '\uE014',
    'Arrow_Right': '\uE014',
    'ArrowRight': '\uE014',
    'Down arrow': '\uE015',
    'Arrow_Down': '\uE015',
    'ArrowDown': '\uE015',
    'Insert': '\uE016',
    'Delete': '\uE017',
    'Semicolon': '\uE018',
    'Equals': '\uE019',
    'Numpad 0': '\uE01A',
    'Numpad 1': '\uE01B',
    'Numpad 2': '\uE01C',
    'Numpad 3': '\uE01D',
    'Numpad 4': '\uE01E',
    'Numpad 5': '\uE01F',
    'Numpad 6': '\uE020',
    'Numpad 7': '\uE021',
    'Numpad 8': '\uE022',
    'Numpad 9': '\uE023',
    'Multiply': '\uE024',
    'Add': '\uE025',
    'Separator': '\uE026',
    'Subtract': '\uE027',
    'Decimal': '\uE028',
    'Divide': '\uE029',
    'F1': '\uE031',
    'F2': '\uE032',
    'F3': '\uE033',
    'F4': '\uE034',
    'F5': '\uE035',
    'F6': '\uE036',
    'F7': '\uE037',
    'F8': '\uE038',
    'F9': '\uE039',
    'F10': '\uE03A',
    'F11': '\uE03B',
    'F12': '\uE03C',
    'Command': '\uE03D',
    'Meta': '\uE03D',
    'Zenkaku_Hankaku': '\uE040',
    'ZenkakuHankaku': '\uE040',
};

function checkUnicode(value): Array<string> {
    return UNICODE_CHARACTERS.hasOwnProperty(value)
        ? [UNICODE_CHARACTERS[value]]
        : new GraphemeSplitter().splitGraphemes(value);
}

export class SeleniumPlugin implements IBrowserProxyPlugin {
    private logger = loggerClient.withPrefix('[selenium-browser-process]');

    private clientCheckInterval: NodeJS.Timer;

    private expiredBrowserClients: Set<string> = new Set();

    private browserClients: Map<string, browserClientItem> = new Map();

    private waitForReadyState: Promise<void> = Promise.resolve();

    private localSelenium: ChildProcess;

    private config: SeleniumPluginConfig;

    constructor(config: Partial<SeleniumPluginConfig> = {}) {
        this.config = this.createConfig(config);

        if (this.config.host === undefined) {
            this.runLocalSelenium();
        }

        this.initIntervals();
    }

    private getDevelopmentConfigAdditions(): Partial<SeleniumPluginConfig> {
        return {
            desiredCapabilities: {
                chromeOptions: {
                    args: [
                        `load-extension=${absoluteExtensionPath}`,
                    ],
                },
            },
        } as any;
    }

    private createConfig(config: Partial<SeleniumPluginConfig>): SeleniumPluginConfig {
        let mergedConfig = deepmerge.all<SeleniumPluginConfig>([
            DEFAULT_CONFIG,
            config,
        ], {
            clone: true,
        });

        if (mergedConfig.recorderExtension) {
            mergedConfig = deepmerge.all<SeleniumPluginConfig>([
                mergedConfig,
                this.getDevelopmentConfigAdditions(),
            ]);
        }

        return mergedConfig;
    }

    private initIntervals() {
        this.clientCheckInterval = setInterval(
            () => this.checkClientsTimeout(),
            this.config.clientCheckInterval
        );

        process.on('exit', () => {
            clearInterval(this.clientCheckInterval);
            this.stopAllSessions().catch((err) => {
                this.logger.error('Clean process exit failed', err);
            });
        });
    }

    private stopAllSessions() {
        let clientsRequests: Promise<any>[] = [];

        for (let [applicant] of this.browserClients) {
            this.logger.debug(`Stopping sessions before process exit for applicant ${applicant}.`);
            clientsRequests.push(this.end(applicant).catch((err) => {
                this.logger.error(`Session stop before process exit error for applicant ${applicant}: \n`, err);
            }));
        }

        return Promise.all(clientsRequests);
    }

    private getChromeDriverArgs() {
        let chromeDriverPath;

        if (this.config.chromeDriverPath) {
            chromeDriverPath = this.config.chromeDriverPath;
        } else {
            chromeDriverPath = require('chromedriver').path;
        }

        return [`-Dwebdriver.chrome.driver=${chromeDriverPath}`];
    }

    private async runLocalSelenium() {
        const seleniumServer = require('selenium-server');
        const seleniumJarPath = seleniumServer.path;
        this.logger.debug('Init local selenium server');

        try {
            this.localSelenium = spawn('java', [
                ...this.getChromeDriverArgs(),
                '-jar', seleniumJarPath,
                '-port', this.config.port,
            ]);

            this.waitForReadyState = new Promise((resolve) => {
                this.localSelenium.stderr.on('data', (data) => {
                    const message = data.toString();

                    this.logger.verbose(message);

                    if (message.includes('SeleniumServer.boot')) {
                        delay(500).then(resolve);
                    }
                });
            });
        } catch (err) {
            this.logger.error('Local selenium server init failed', err);
        }
    }

    private getApplicantSessionId(applicant): string | undefined {
        let item = this.browserClients.get(applicant);

        if (item) {
            return item.sessionId;
        }
    }

    private getBrowserClient(applicant): Client<any> | undefined {
        let item = this.browserClients.get(applicant);

        if (item) {
            return item.client;
        }
    }

    private async checkClientsTimeout() {
        if (this.config.clientTimeout === 0) {
            for (let [applicant] of this.browserClients) {
                try {
                    this.execute(applicant, '(function () {})()', []);
                } catch (e) { /* ignore */ }
            }
        } else {
            const timeLimit = Date.now() - this.config.clientTimeout;

            for (let [applicant, clientData] of this.browserClients) {
                if (clientData.initTime < timeLimit) {
                    this.logger.warn(`Session applicant ${applicant} marked as expired`);
                    try {
                        await this.end(applicant);
                    } catch (e) {
                        this.logger.error(`Session applicant ${applicant} failed to stop`, e);
                    }
                    this.expiredBrowserClients.add(applicant);
                }
            }
        }
    }

    private async createClient(applicant: string): Promise<void> {
        await this.waitForReadyState;
        const clientData = this.browserClients.get(applicant);

        if (clientData) {
            this.browserClients.set(applicant, {
                ...clientData,
                initTime: Date.now(),
            });

            return;
        }

        if (this.expiredBrowserClients.has(applicant)) {
            throw Error(`This session expired in ${this.config.clientTimeout}ms`);
        }

        const client = remote(this.config);
        const { sessionId = null } = (await client.init() || {});
        this.addElementKeysMethod(client);

        if (sessionId === null) {
            throw Error('Session can not be null');
        }

        this.browserClients.set(applicant, {
            client,
            sessionId,
            initTime: Date.now(),
        });
        this.logger.debug(`Started session for applicant: ${applicant}. Session id: ${sessionId}`);
    }

    protected addElementKeysMethod(client: Client<any>) {
        client.addCommand('keysOnElement', function (path, value) {
            let keySequence: string[] = [];

            if (typeof value === 'string') {
                keySequence = checkUnicode(value);
            } else if (value instanceof Array) {
                for (const charSet of value) {
                    keySequence = keySequence.concat(checkUnicode(charSet));
                }
            } else {
                throw new Error('"keys" command requires a string or array of strings as parameter');
            }

            return this.setValue(path, keySequence);
        }, true);
    }

    private wrapWithPromise<T>(item: Client<RawResult<T> | T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            try {
                item
                    .then((rawResult) => {
                        if (
                            rawResult !== null &&
                            typeof rawResult === 'object' &&
                            'value' in (rawResult as RawResult<T>)
                        ) {
                            resolve(rawResult['value']);
                        } else {
                            resolve(rawResult as T);
                        }
                    })
                    .catch((exception) => {
                        const formattedError = new Error(exception.message);

                        reject(formattedError);
                    });
            } catch (error) {
                reject(error);
            }
        });
    }

    public async end(applicant: string) {
        await this.waitForReadyState;

        const client = this.getBrowserClient(applicant);

        if (client) {
            try {
                await this.wrapWithPromise(client.alertDismiss());
            } catch { /* ignore */ }

            const startingSessionID = this.getApplicantSessionId(applicant);
            const sessionID = ((client as any).requestHandler || {}).sessionID;

            if (startingSessionID === sessionID) {
                this.logger.debug(`Stopping sessions for applicant ${applicant}. Session id: ${sessionID}`);
            } else {
                this.logger.warn(`Stopping sessions for applicant warning ${applicant}.`,
                    `Session ids are not equal, started with - ${startingSessionID}, ended with - ${sessionID}`);
                try {
                    await this.wrapWithPromise(client.session('DELETE', startingSessionID));
                } catch (err) {
                    this.logger.error(`Old session ${startingSessionID} delete error`, err);
                }
            }

            this.browserClients.delete(applicant);
            await this.wrapWithPromise(client.end());
        }
    }

    public async kill() {
        this.logger.debug('Kill command is called');
        for (const applicant of this.browserClients.keys()) {
            try {
                await this.end(applicant);
            } catch (e) {
                this.logger.error(e);
            }
        }

        if (this.localSelenium) {
            this.localSelenium.kill();
        }
    }

    public async refresh(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.refresh());
        }
    }

    public async click(applicant: string, selector: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.click(selector));
        }
    }

    public async gridProxyDetails(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.gridProxyDetails());
        }
    }

    public async url(applicant: string, val: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.url(val));
        }
    }

    public async newWindow(applicant: string, val: string, windowName: string, windowFeatures: WindowFeaturesConfig) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);
        const args = stringifyWindowFeatures(windowFeatures);

        if (client) {
            return this.wrapWithPromise(client.newWindow(val, windowName, args));
        }
    }

    public async waitForExist(applicant: string, xpath: string, timeout: number) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.waitForExist(xpath, timeout));
        }
    }

    public async waitForVisible(applicant: string, xpath: string, timeout: number) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.waitForVisible(xpath, timeout));
        }
    }

    public async isVisible(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.isVisible(xpath));
        }
    }

    public async moveToObject(applicant: string, xpath: string, x: number, y: number) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.moveToObject(xpath, x, y));
        }
    }

    public async execute(applicant: string, fn: any, args: Array<any>) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.execute(fn, ...args));
        }
    }

    public async executeAsync(applicant: string, fn: any, args: Array<any>) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.executeAsync(fn, ...args));
        }
    }

    public async getTitle(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.getTitle());
        }
    }

    public async clearElement(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.clearElement(xpath));
        }
    }

    public async keys(applicant: string, value: any) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            client.keys(value);
        }
    }

    public async elementIdText(applicant: string, elementId: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.elementIdText(elementId));
        }
    }

    public async elements(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.elements(xpath));
        }
    }

    public async frame(applicant: string, frameID: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.frame(frameID));
        }
    }

    public async frameParent(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.frameParent());
        }
    }

    public async getValue(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.getValue(xpath));
        }
    }

    public async keysOnElement(applicant: string, xpath: string, value: any) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise((client as any).keysOnElement(xpath, value));
        }
    }

    public async setValue(applicant: string, xpath: string, value: any) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.setValue(xpath, value));
        }
    }

    public async selectByIndex(applicant: string, xpath: string, value: any) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.selectByIndex(xpath, value));
        }
    }

    public async selectByValue(applicant: string, xpath: string, value: any) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.selectByValue(xpath, value));
        }
    }

    public async selectByVisibleText(applicant: string, xpath: string, str: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.selectByVisibleText(xpath, str));
        }
    }

    public async getAttribute(applicant: string, xpath: string, attr: string): Promise<any> {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.getAttribute(xpath, attr));
        }
    }

    public async windowHandleMaximize(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.windowHandleMaximize());
        }
    }

    public async isEnabled(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.isEnabled(xpath));
        }
    }

    public async scroll(applicant: string, xpath: string, x: number, y: number) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.scroll(xpath, x, y));
        }
    }

    public async alertAccept(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.alertAccept());
        }
    }

    public async alertDismiss(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.alertDismiss());
        }
    }

    public async alertText(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.alertText() as Client<string>);
        }
    }

    public async dragAndDrop(applicant: string, xpathSource: string, xpathDestination: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.dragAndDrop(xpathSource, xpathDestination));
        }
    }

    public async getCookie(applicant: string, cookieName: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.getCookie(cookieName));
        }
    }

    public async deleteCookie(applicant: string, cookieName: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.deleteCookie(cookieName));
        }
    }

    public async getHTML(applicant: string, xpath: string, b: any) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.getHTML(xpath, b));
        }
    }

    public async getCurrentTabId(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.getCurrentTabId());
        }
    }

    public async switchTab(applicant: string, tabId: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            let result = this.wrapWithPromise(client.switchTab(tabId));
            await waitFor(client);

            return result;
        }
    }

    public async close(applicant: string, tabId: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.close(tabId));
        }
    }

    public async getTabIds(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.getTabIds());
        }
    }

    public async window(applicant: string, fn: any) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.window(fn));
        }
    }

    public async windowHandles(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.windowHandles());
        }
    }


    public async getTagName(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.getTagName(xpath));
        }
    }

    public async isSelected(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.isSelected(xpath));
        }
    }

    public async getText(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.getText(xpath));
        }
    }

    public async elementIdSelected(applicant: string, id: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.elementIdSelected(id));
        }
    }

    public async makeScreenshot(applicant: string): Promise<string | void> {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.screenshot());
        }
    }

    public async uploadFile(applicant: string, filePath: string): Promise<string | void> {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.uploadFile(filePath));
        }
    }

    public async getCssProperty(applicant: string, xpath: string, cssProperty: string): Promise<any> {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.getCssProperty(xpath, cssProperty));
        }
    }

    public async getSource(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.getSource());
        }
    }

    public async isExisting(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.isExisting(xpath));
        }
    }

    public async waitForValue(applicant: string, xpath: string, timeout: number, reverse: boolean) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.waitForValue(xpath, timeout, reverse));
        }
    }

    public async waitForSelected(applicant: string, xpath: string, timeout: number, reverse: boolean) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.waitForSelected(xpath, timeout, reverse));
        }
    }

    public async waitUntil(
        applicant: string,
        condition: () => boolean | Promise<boolean> | Client<RawResult<any>> & RawResult<any>,
        timeout?: number,
        timeoutMsg?: string,
        interval?: number
    ): Promise<Client<boolean> & any> {

        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.waitUntil(condition, timeout, timeoutMsg, interval));
        }
    }

    public async selectByAttribute(applicant: string, xpath: string, attribute: string, value: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.selectByAttribute(xpath, attribute, value));
        }
    }

    public async getGridNodeDetails(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.getGridNodeDetails());
        }
    }

    public async gridTestSession(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (client) {
            return this.wrapWithPromise(client.gridTestSession());
        }
    }
}

export default function seleniumProxy(config: Config) {
    return new SeleniumPlugin(config);
}
