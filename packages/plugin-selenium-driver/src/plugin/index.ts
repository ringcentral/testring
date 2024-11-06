import {SeleniumPluginConfig} from '../types';
import {IBrowserProxyPlugin, WindowFeaturesConfig} from '@testring/types';

import {ChildProcess} from 'child_process';

import {remote} from 'webdriverio';
import * as deepmerge from 'deepmerge';

import {spawn} from '@testring/child-process';
import {loggerClient} from '@testring/logger';
import {getCrxBase64} from '@testring/dwnld-collector-crx';
import {absoluteExtensionPath} from '@testring/devtool-extension';
import {CDPCoverageCollector} from '@nullcc/code-coverage-client';

import type {Cookie} from '@wdio/protocols';
import type {
    ClickOptions,
    MockFilterOptions,
} from 'webdriverio';
import type {JsonCompatible} from '@wdio/types';
import type {RespondWithOptions} from 'webdriverio/build/utils/interception/types';
import webdriver from 'webdriver';

type BrowserObjectCustom = WebdriverIO.Browser & {
    sessionId: string;
};

type browserClientItem = {
    client: BrowserObjectCustom;
    sessionId: string;
    initTime: number;
    cdpCoverageCollector: CDPCoverageCollector;
};

const DEFAULT_CONFIG: SeleniumPluginConfig = {
    recorderExtension: false,
    clientCheckInterval: 5 * 1000,
    clientTimeout: 15 * 60 * 1000,
    port: 4444,
    logLevel: 'error',
    capabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
            // for local ChromeDriver
            args: [] as string[],
        },
        'wdio:enforceWebDriverClassic': true
    },
    cdpCoverage: false,
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

export class SeleniumPlugin implements IBrowserProxyPlugin {
    private logger = loggerClient.withPrefix('[selenium-browser-process]');

    private clientCheckInterval: NodeJS.Timer;

    private expiredBrowserClients: Set<string> = new Set();

    private browserClients: Map<string, browserClientItem> = new Map();

    private waitForReadyState: Promise<void> = Promise.resolve();

    private localSelenium: ChildProcess;

    private config: SeleniumPluginConfig;

    private incrementWinId = 0;

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
                    args: [`load-extension=${absoluteExtensionPath}`],
                },
            },
        } as any;
    }

    // eslint-disable-next-line sonarjs/cognitive-complexity
    private createConfig(
        config: Partial<SeleniumPluginConfig>,
    ): SeleniumPluginConfig {
        let mergedConfig = deepmerge.all<SeleniumPluginConfig>(
            [DEFAULT_CONFIG, config],
            {
                clone: true,
            },
        );

        if (mergedConfig.recorderExtension) {
            mergedConfig = deepmerge.all<SeleniumPluginConfig>(
                [mergedConfig, this.getDevelopmentConfigAdditions()],
                {
                    customMerge: (mergeKey) => {
                        if (mergeKey === 'goog:chromeOptions') {
                            return (itemA, itemB) => {
                                if (!itemA.args || !itemB.args) {
                                    return deepmerge(itemA, itemB);
                                }
                                const res: Record<string, any> = {};
                                res.args = deepmerge(itemA.args, itemB.args);
                                let ext: string[] = res.args.filter(
                                    (argItem: string) =>
                                        argItem.startsWith('load-extension'),
                                );
                                if (ext.length === 2) {
                                    ext = [
                                        `load-extension=${ext[0]
                                            .split('=', 2)
                                            .pop()},${ext[1]
                                            .split('=', 2)
                                            .pop()}`,
                                    ];
                                }
                                res.args = [
                                    ...ext,
                                    ...res.args.filter(
                                        (argItem: string) =>
                                            !argItem.startsWith(
                                                'load-extension',
                                            ),
                                    ),
                                ];
                                Object.keys(itemA).forEach((key) => {
                                    if (key === 'args') {
                                        return;
                                    }
                                    if (itemB[key] !== undefined) {
                                        res[key] = deepmerge(
                                            itemA[key],
                                            itemB[key],
                                        );
                                    } else {
                                        res[key] = itemA[key];
                                    }
                                });
                                Object.keys(itemB).forEach((key) => {
                                    if (
                                        key === 'args' ||
                                        res[key] !== undefined
                                    ) {
                                        return;
                                    }

                                    res[key] = itemB[key];
                                });
                                return res;
                            };
                        }
                    },
                },
            );
        }

        if (!mergedConfig.hostname && mergedConfig.host) {
            mergedConfig.hostname = mergedConfig.host;
        }

        const googleChromeOptions = mergedConfig.capabilities?.['goog:chromeOptions'];
        if (googleChromeOptions?.args?.includes('--headless=new')) {
            const extensions = googleChromeOptions.extensions;
            const dowldMonitorCrx = getCrxBase64();
            if (extensions) {
                extensions.push(dowldMonitorCrx);
            } else {
                googleChromeOptions.extensions = [dowldMonitorCrx];
            }
        }

        return mergedConfig;
    }

    private initIntervals() {
        if (this.config.clientCheckInterval > 0) {
            this.clientCheckInterval = setInterval(
                () => this.checkClientsTimeout(),
                this.config.clientCheckInterval,
            );
        }

        process.on('exit', () => {
            clearInterval(this.clientCheckInterval as NodeJS.Timeout);
            this.stopAllSessions().catch((err) => {
                this.logger.error('Clean process exit failed', err);
            });
        });
    }

    private stopAllSessions() {
        const clientsRequests: Promise<any>[] = [];

        for (const [applicant] of this.browserClients) {
            this.logger.debug(
                `Stopping sessions before process exit for applicant ${applicant}.`,
            );
            clientsRequests.push(
                this.end(applicant).catch((err) => {
                    this.logger.error(
                        `Session stop before process exit error for applicant ${applicant}: \n`,
                        err,
                    );
                }),
            );
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
                '-jar',
                seleniumJarPath,
                '-port',
                this.config.port,
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
        const item = this.browserClients.get(applicant);

        if (item) {
            return item.sessionId;
        }
    }

    private hasBrowserClient(applicant): boolean {
        return this.browserClients.has(applicant);
    }

    private getBrowserClient(applicant): BrowserObjectCustom {
        const item = this.browserClients.get(applicant);

        if (item) {
            return item.client;
        }

        throw new Error('Browser client is not found');
    }

    private async pingClients() {
        for (const [applicant] of this.browserClients) {
            try {
                await this.execute(applicant, '(function () {})()', []);
            } catch (e) {
                /* ignore */
            }
        }
    }

    private async closeExpiredClients() {
        const timeLimit = Date.now() - this.config.clientTimeout;

        for (const [applicant, clientData] of this.browserClients) {
            if (clientData.initTime < timeLimit) {
                this.logger.warn(
                    `Session applicant ${applicant} marked as expired`,
                );
                try {
                    await this.end(applicant);
                } catch (e) {
                    this.logger.error(
                        `Session applicant ${applicant} failed to stop`,
                        e,
                    );
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

    private async createClient(
        applicant: string,
        config?: Partial<WebdriverIO.Config>,
    ): Promise<void> {
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
            throw Error(
                `This session expired in ${this.config.clientTimeout}ms`,
            );
        }

        const _config: any = deepmerge.all([
            {},
            this.config,
            (config as any) || {},
        ]);
        const client = await remote(_config);

        let sessionId: string;
        if (client.sessionId) {
            sessionId = client.sessionId;
        } else {
            throw Error('Session can not be null');
        }

        const customClient = this.addCustromMethods(
            client as BrowserObjectCustom,
        );

        let cdpCoverageCollector;
        if (this.config.cdpCoverage) {
            this.logger.debug('Started to init cdp coverage....');
            cdpCoverageCollector = await this.enableCDPCoverageClient(client);
            this.logger.debug('ended to init cdp coverage....');
        }
        this.browserClients.set(applicant, {
            client: customClient,
            sessionId,
            initTime: Date.now(),
            cdpCoverageCollector: cdpCoverageCollector
                ? cdpCoverageCollector
                : null,
        });

        this.logger.debug(
            `Started session for applicant: ${applicant}. Session id: ${sessionId}`,
        );
    }

    private async enableCDPCoverageClient(client) {
        if (this.config.host === undefined) {
            return null;
        }
        //accurate
        if (!client.capabilities['se:cdp']) {
            return null;
        }
        const cdpAddress = client.capabilities['se:cdp'];
        const collector = new CDPCoverageCollector({
            wsEndpoint: cdpAddress,
        });
        await collector.init();
        await collector.start();
        return collector;
    }

    public async getCdpCoverageFile(applicant: string) {
        const clientData = this.browserClients.get(applicant);
        this.logger.debug(`start upload coverage for applicant ${applicant}`);
        if (!clientData) {
            return;
        }
        const coverageCollector = clientData.cdpCoverageCollector;
        if (!coverageCollector) {
            return;
        }
        const {coverage} = await coverageCollector.collect();
        await coverageCollector.stop();
        return [Buffer.from(JSON.stringify(coverage))];
    }

    protected addCustromMethods(
        client: BrowserObjectCustom,
    ): BrowserObjectCustom {
        return client as BrowserObjectCustom;
    }

    public async end(applicant: string) {
        await this.waitForReadyState;

        if (!this.hasBrowserClient(applicant)) {
            this.logger.warn(`No ${applicant} is registered`);
            return;
        }

        const client = this.getBrowserClient(applicant);

        try {
            await this.alertDismiss(applicant);
        } catch {
            /* ignore */
        }

        const startingSessionID = this.getApplicantSessionId(applicant);
        const sessionID = client.sessionId;

        if (startingSessionID === sessionID) {
            this.logger.debug(
                `Stopping sessions for applicant ${applicant}. Session id: ${sessionID}`,
            );
            await client.deleteSession();
        } else {
            await this.logger.stepWarning(
                `Stopping sessions for applicant warning ${applicant}. ` +
                    `Session ids are not equal, started with - ${startingSessionID}, ended with - ${sessionID}`,
                async () => {
                    try {
                        if (startingSessionID) {
                            const attachedClient = webdriver.attachToSession({
                                sessionId: startingSessionID,
                            });
                            await attachedClient.deleteSession();
                        }
                    } catch (err) {
                        this.logger.error(
                            `Old session ${startingSessionID} delete error`,
                            err,
                        );
                    }

                    try {
                        await client.deleteSession();
                    } catch (err) {
                        this.logger.error(
                            `New session ${client.sessionId} delete error`,
                            err,
                        );
                    }
                },
            );
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

    public async click(
        applicant: string,
        selector: string,
        options?: ClickOptions,
    ) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const element = await client.$(selector);
        return element.click(options);
    }

    public async getSize(applicant: string, selector: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const element = await client.$(selector);

        return element.getSize();
    }

    public async url(applicant: string, val: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (!val) {
            return client.getUrl();
        }

        return client.url(val);
    }

    generateWinId() {
        this.incrementWinId++;

        return `window-${this.incrementWinId}`;
    }

    public async newWindow(
        applicant: string,
        val: string,
        windowName: string,
        windowFeatures: WindowFeaturesConfig = {},
    ) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);
        const args = stringifyWindowFeatures(windowFeatures);

        const newWindow = await client.newWindow(val, {
            windowName: windowName || this.generateWinId(),
            windowFeatures: args,
        });
        return newWindow?.handle || newWindow;
    }

    public async waitForExist(
        applicant: string,
        xpath: string,
        timeout: number,
    ) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.waitForExist({timeout});
    }

    public async waitForVisible(
        applicant: string,
        xpath: string,
        timeout: number,
    ) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.waitForDisplayed({timeout});
    }

    public async isVisible(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.isDisplayed();
    }

    public async moveToObject(
        applicant: string,
        xpath: string,
        xOffset = 0,
        yOffset = 0,
    ) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.moveTo({xOffset, yOffset});
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

        const elements = (await client.findElements('xpath', xpath)) as unknown;
        return (elements as Array<Record<string, string>>).map((o) => {
            const keys = Object.keys(o);
            return {ELEMENT: o[keys[0]]};
        });
    }

    public async frame(applicant: string, frameID: any) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);
        return client.switchFrame(frameID);
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

    public async selectByVisibleText(
        applicant: string,
        xpath: string,
        str: string,
    ) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.selectByVisibleText(str);
    }

    public async getAttribute(
        applicant: string,
        xpath: string,
        attr: string,
    ): Promise<any> {
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

    public async scroll(
        applicant: string,
        xpath: string,
        xOffset: number,
        yOffset: number,
    ) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const element = await client.$(xpath);
        await element.scrollIntoView();
        return element.moveTo({xOffset, yOffset});
    }

    public async scrollIntoView(
        applicant: string,
        xpath: string,
        scrollIntoViewOptions?: boolean | null,
    ) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const element = await client.$(xpath);
        await element.scrollIntoView(
            scrollIntoViewOptions !== null ? scrollIntoViewOptions : undefined,
        );
    }

    public async isAlertOpen(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.isAlertOpen();
    }

    public async alertAccept(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (await this.isAlertOpen(applicant)) {
            return client.acceptAlert();
        }

        throw Error('There is no open alert');
    }

    public async alertDismiss(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (await this.isAlertOpen(applicant)) {
            return client.dismissAlert();
        }

        throw Error('There is no open alert');
    }

    public async alertText(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (await this.isAlertOpen(applicant)) {
            return client.getAlertText();
        }

        throw Error('There is no open alert');
    }

    public async dragAndDrop(
        applicant: string,
        xpathSource: string,
        xpathDestination: string,
    ) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const sourceElement = await client.$(xpathSource);
        const destinationElement = await client.$(xpathDestination);
        return sourceElement.dragAndDrop(destinationElement);
    }

    public async setCookie(applicant: string, cookieObj: Cookie) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return await client.setCookies(cookieObj);
    }

    public async getCookie(applicant: string, cookieName?: string | null) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (cookieName) {
            try {
                const cookies = await client.getCookies([cookieName]);
                return cookies[0]?.value;
            } catch (e) {
                return undefined;
            }
        }

        return client.getAllCookies();
    }

    public async deleteCookie(applicant: string, cookieName?: string | null) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (cookieName) {
            return client.deleteCookie(cookieName);
        }

        return client.deleteAllCookies();
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

    public async getTabIds(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.getWindowHandles();
    }

    // @deprecated
    public async windowHandles(applicant: string) {
        return this.getTabIds(applicant);
    }

    public async window(applicant: string, tabId: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.switchToWindow(tabId);
    }

    public async switchTab(applicant: string, tabId: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const result = await client.switchToWindow(tabId);
        const body = await client.$('body');
        await client.waitUntil(async () => body.isExisting(), {timeout: 10000});

        return result;
    }

    public async close(applicant: string, tabId: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);
        const tabs = await this.getTabIds(applicant);

        if (tabs.length === 1 && tabs[0] === tabId) {
            return this.end(applicant);
        }

        await client.switchToWindow(tabId);

        return client.closeWindow();
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

    public async uploadFile(
        applicant: string,
        filePath: string,
    ): Promise<string | void> {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.uploadFile(filePath);
    }

    public async getCssProperty(
        applicant: string,
        xpath: string,
        cssProperty: string,
    ): Promise<any> {
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

    public async waitForValue(
        applicant: string,
        xpath: string,
        timeout: number,
        reverse: boolean,
    ) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.waitUntil(
            async () => {
                const elemValue = await (await client.$(xpath)).getValue();
                return reverse ? !elemValue : !!elemValue;
            },
            {timeout},
        );
    }

    public async waitForSelected(
        applicant: string,
        xpath: string,
        timeout: number,
        reverse: boolean,
    ) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.waitUntil(
            async () => {
                const isSelected = await (await client.$(xpath)).isSelected();
                return reverse ? !isSelected : isSelected;
            },
            {timeout},
        );
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

        return client.waitUntil(condition, {timeout, timeoutMsg, interval});
    }

    public async selectByAttribute(
        applicant: string,
        xpath: string,
        attribute: string,
        value: string,
    ) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.selectByAttribute(attribute, value);
    }

    // @deprecated WAT-1872
    public async gridProxyDetails(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (this.localSelenium) {
            return {
                localSelenium: true,
            };
        }

        return client.gridProxyDetails(client.sessionId);
    }

    // @deprecated WAT-1872
    public async gridTestSession(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (this.localSelenium) {
            return {
                localSelenium: true,
            };
        }

        return client.gridTestSession(client.sessionId);
    }

    // @deprecated WAT-1872
    public async getGridNodeDetails(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const testSession = await this.gridTestSession(applicant);

        if (testSession && !testSession.localSelenium) {
            const proxyDetails = await client.gridProxyDetails(applicant);

            delete testSession.msg;
            delete testSession.success;

            delete proxyDetails.msg;
            delete proxyDetails.success;
            delete proxyDetails.id;

            return {...testSession, ...proxyDetails};
        }

        return testSession;
    }

    /**
     * @param overwrites should NOT be an arrow function, Otherwise it would throw an error
     */
    public async mock(
        applicant: string,
        url: string,
        overwrites: string | JsonCompatible | Buffer,
        filterOptions?: MockFilterOptions,
        mockResponseParams?: Omit<RespondWithOptions, 'body'>,
    ) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const mock = await client.mock(url, filterOptions);
        mock.respond(overwrites, mockResponseParams);
    }

    public async emulateDevice(applicant: string, deviceName) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        await client.deleteSession();
        this.browserClients.delete(applicant);
        await this.createClient(applicant, {
            capabilities: {
                'goog:chromeOptions': {
                    mobileEmulation: {
                        deviceName,
                    },
                },
            },
        } as any);
    }
}

export default function seleniumProxy(config: SeleniumPluginConfig) {
    return new SeleniumPlugin(config);
}
