import { SeleniumPluginConfig } from '../types';
import { IBrowserProxyPlugin, WindowFeaturesConfig } from '@testring/types';
import GraphemeSplitter from 'grapheme-splitter';

import { ChildProcess } from 'child_process';

import { Config, BrowserObject, remote } from 'webdriverio';
import * as deepmerge from 'deepmerge';

import { spawn } from '@testring/child-process';
import { loggerClient } from '@testring/logger';
import { absoluteExtensionPath } from '@testring/devtool-extension';

type BrowserObjectCustom = BrowserObject & {
    keysOnElement: (xpath, value) => Promise<void>;
}

type browserClientItem = {
    client: BrowserObjectCustom;
    sessionId: string;
    initTime: number;
};

const DEFAULT_CONFIG: SeleniumPluginConfig = {
    recorderExtension: false,
    clientCheckInterval: 5 * 1000,
    clientTimeout: 15 * 60 * 1000,
    port: 4444,
    logLevel: 'warn',
    capabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': { // for local ChromeDriver
            args: [],
        },
    },
};

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
    return Object.prototype.hasOwnProperty.call(UNICODE_CHARACTERS, value)
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
            capabilities: {
                'goog:chromeOptions': {
                    args: [
                        `load-extension=${absoluteExtensionPath}`,
                    ],
                },
            },
        } as any;
    }

    private createConfig(config: Partial<SeleniumPluginConfig>): SeleniumPluginConfig {
        let capabilities;

        if (config.desiredCapabilities && config.capabilities) {
            capabilities = deepmerge.all<any>([config.desiredCapabilities, config.capabilities]);
        } else {
            capabilities = config.desiredCapabilities || config.capabilities;
        }

        let mergedConfig = deepmerge.all<SeleniumPluginConfig>([
            DEFAULT_CONFIG,
            {
                ...config,
                capabilities,
            },
        ], {
            clone: true,
        });

        if (mergedConfig.recorderExtension) {
            mergedConfig = deepmerge.all<SeleniumPluginConfig>([
                mergedConfig,
                this.getDevelopmentConfigAdditions(),
            ]);
        }

        if (!mergedConfig.hostname && mergedConfig.host) {
            mergedConfig.hostname = mergedConfig.host;
        }

        delete mergedConfig.desiredCapabilities;

        return mergedConfig;
    }

    private initIntervals() {
        this.clientCheckInterval = setInterval(
            () => this.checkClientsTimeout(),
            this.config.clientCheckInterval,
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

            this.waitForReadyState = new Promise((resolve, reject) => {
                if (this.localSelenium.stderr) {
                    this.localSelenium.stderr.on('data', (data) => {
                        const message = data.toString();

                        this.logger.verbose(message);

                        if (message.includes('SeleniumServer.boot')) {
                            delay(500).then(resolve);
                        }
                    });
                } else {
                    reject(new Error('There is no STDERR on selenium worker'));
                }
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

    private getBrowserClient(applicant): BrowserObjectCustom {
        let item = this.browserClients.get(applicant);

        if (item) {
            return item.client;
        }

        throw new Error('Browser client is not found');
    }

    private async pingClients() {
        for (let [applicant] of this.browserClients) {
            try {
                await this.execute(applicant, '(function () {})()', []);
            } catch (e) { /* ignore */ }
        }
    }

    private async closeExpiredClients() {
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

    private async checkClientsTimeout() {
        if (this.config.clientTimeout === 0) {
            await this.pingClients();
        } else {
            await this.closeExpiredClients();
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

        const client = await remote(this.config);

        let sessionId: string;
        if (client.sessionId) {
            sessionId = client.sessionId;
        } else {
            throw Error('Session can not be null');
        }

        const customClient = this.addCustromMethods(client);

        this.browserClients.set(applicant, {
            client: customClient,
            sessionId,
            initTime: Date.now(),
        });

        this.logger.debug(`Started session for applicant: ${applicant}. Session id: ${sessionId}`);
    }

    protected addCustromMethods(client: BrowserObject): BrowserObjectCustom {
        client.addCommand('keysOnElement', async function (path, value) {
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

            const selector = await this.$(path);

            return selector.setValue(keySequence);
        }, false);

        return client as BrowserObjectCustom;
    }

    public async end(applicant: string) {
        await this.waitForReadyState;

        const client = this.getBrowserClient(applicant);

        try {
            if (await client.isAlertOpen()) {
                await client.dismissAlert();
            }
        } catch { /* ignore */ }

        const startingSessionID = this.getApplicantSessionId(applicant);
        const sessionID = client.sessionId;

        if (startingSessionID === sessionID) {
            this.logger.debug(`Stopping sessions for applicant ${applicant}. Session id: ${sessionID}`);
        } else {
            this.logger.warn(`Stopping sessions for applicant warning ${applicant}.`,
                `Session ids are not equal, started with - ${startingSessionID}, ended with - ${sessionID}`);
            try {
                await client.deleteSession();
            } catch (err) {
                this.logger.error(`Old session ${startingSessionID} delete error`, err);
            }
        }

        this.browserClients.delete(applicant);
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

        return client.refresh();
    }

    public async click(applicant: string, selector: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const element = await client.$(selector);
        return element.click();
    }

    public async gridProxyDetails(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.gridProxyDetails(client.sessionId);
    }

    public async url(applicant: string, val: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (!val) {
            return client.getUrl();
        }

        return client.url(val);
    }

    public async newWindow(applicant: string, val: string, windowName: string, windowFeatures: WindowFeaturesConfig) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);
        const args = stringifyWindowFeatures(windowFeatures);

        return client.newWindow(val, windowName, args);
    }

    public async waitForExist(applicant: string, xpath: string, timeout: number) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.waitForExist(timeout);
    }

    public async waitForVisible(applicant: string, xpath: string, timeout: number) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.waitForDisplayed(timeout);
    }

    public async isVisible(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.isDisplayed();
    }

    public async moveToObject(applicant: string, xpath: string, x: number, y: number) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const elem = await client.$(xpath);
        await elem.scrollIntoView();
        return elem.moveTo(x, y);
    }

    public async execute(applicant: string, fn: any, args: Array<any>) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.execute(fn, ...args);
    }

    public async executeAsync(applicant: string, fn: any, args: Array<any>) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.executeAsync(fn, ...args);
    }

    public async getTitle(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.getTitle();
    }

    public async clearElement(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.clearValue();
    }

    public async keys(applicant: string, value: any) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.keys(value);
    }

    public async elementIdText(applicant: string, elementId: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.getElementText(elementId);
    }

    public async elements(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const elements = await client.findElements('xpath', xpath) as unknown;
        return (elements as Array<Record<string, string>>).map((o) => {
            const keys = Object.keys(o);
            return { 'ELEMENT': o[keys[0]] };
        });
    }

    public async frame(applicant: string, frameID: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.switchToFrame(frameID);
    }

    public async frameParent(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.switchToParentFrame();
    }

    public async getValue(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.getValue();
    }

    public async keysOnElement(applicant: string, xpath: string, value: any) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.keysOnElement(xpath, value);
    }

    public async setValue(applicant: string, xpath: string, value: any) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.setValue(value);
    }

    public async selectByIndex(applicant: string, xpath: string, value: any) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.selectByIndex(value);
    }

    public async selectByValue(applicant: string, xpath: string, value: any) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.selectByAttribute('value', value);
    }

    public async selectByVisibleText(applicant: string, xpath: string, str: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.selectByVisibleText(str);
    }

    public async getAttribute(applicant: string, xpath: string, attr: string): Promise<any> {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.getAttribute(attr);
    }

    public async windowHandleMaximize(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.maximizeWindow();
    }

    public async isEnabled(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.isEnabled();
    }

    public async scroll(applicant: string, xpath: string, x: number, y: number) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const element = await client.$(xpath);
        await element.scrollIntoView();
        return element.moveTo(x, y);
    }

    public async alertAccept(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.acceptAlert();
    }

    public async alertDismiss(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.dismissAlert();
    }

    public async alertText(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.getAlertText();
    }

    public async dragAndDrop(applicant: string, xpathSource: string, xpathDestination: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const sourceElement = await client.$(xpathSource);
        const destinationElement = await client.$(xpathDestination);
        return sourceElement.dragAndDrop(destinationElement);
    }

    public async getCookie(applicant: string, cookieName: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const cookies = await client.getCookies([cookieName]);
        return cookies[0].value;
    }

    public async deleteCookie(applicant: string, cookieName: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.deleteCookie(cookieName);
    }

    public async getHTML(applicant: string, xpath: string, b: any) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.getHTML(b);
    }

    public async getCurrentTabId(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.getWindowHandle();
    }

    public async switchTab(applicant: string, tabId: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const result = client.switchWindow(tabId);
        await client.waitUntil(async () => (await client.$('body')).isExisting(), 10000);

        return result;
    }

    public async close(applicant: string, tabId: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        await client.switchWindow(tabId);
        return client.closeWindow();
    }

    public async getTabIds(applicant: string) {
        return this.windowHandles(applicant);
    }

    public async window(applicant: string, fn: any) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.switchWindow(fn);
    }

    public async windowHandles(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.getWindowHandles();
    }


    public async getTagName(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.getTagName();
    }

    public async isSelected(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.isSelected();
    }

    public async getText(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.getText();
    }

    public async elementIdSelected(applicant: string, id: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.isElementSelected(id);
    }

    public async makeScreenshot(applicant: string): Promise<string | void> {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.takeScreenshot();
    }

    public async uploadFile(applicant: string, filePath: string): Promise<string | void> {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.uploadFile(filePath);
    }

    public async getCssProperty(applicant: string, xpath: string, cssProperty: string): Promise<any> {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const element = await client.$(xpath);
        const property = await element.getCSSProperty(cssProperty);
        return property.value;
    }

    public async getSource(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.getPageSource();
    }

    public async isExisting(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.isExisting();
    }

    public async waitForValue(applicant: string, xpath: string, timeout: number, reverse: boolean) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.waitUntil(async () => {
            const elemValue = await (await client.$(xpath)).getValue();
            return reverse ? !elemValue : !!elemValue;
        }, timeout);
    }

    public async waitForSelected(applicant: string, xpath: string, timeout: number, reverse: boolean) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.waitUntil(async () => {
            const isSelected = await (await client.$(xpath)).isSelected();
            return reverse ? !isSelected : isSelected;
        }, timeout);
    }

    public async waitUntil(
        applicant: string,
        condition: () => Promise<boolean>,
        timeout?: number,
        timeoutMsg?: string,
        interval?: number,
    ) {

        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.waitUntil(condition, timeout, timeoutMsg, interval);
    }

    public async selectByAttribute(applicant: string, xpath: string, attribute: string, value: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.selectByAttribute(attribute, value);
    }

    public async getGridNodeDetails(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const testSession = await client.gridTestSession(client.sessionId);
        const proxyDetails = await client.gridProxyDetails(testSession.proxyId);

        delete testSession.msg;
        delete testSession.success;

        delete proxyDetails.msg;
        delete proxyDetails.success;
        delete proxyDetails.id;

        return { ...testSession, ...proxyDetails };
    }

    public async gridTestSession(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.gridTestSession(client.sessionId);
    }
}

// eslint-disable-next-line import/no-default-export
export default function seleniumProxy(config: Config) {
    return new SeleniumPlugin(config);
}
