import {SeleniumPluginConfig} from '../types';
import {
    IBrowserProxyPlugin,
    SavePdfOptions,
    WindowFeaturesConfig,
    IWindowFeatures
} from '@testring/types';

import {ChildProcess} from 'child_process';

import {remote} from 'webdriverio';
import * as deepmerge from 'deepmerge';

import {spawnWithPipes} from '@testring/child-process';
import {loggerClient} from '@testring/logger';
import {getCrxBase64} from '@testring/dwnld-collector-crx';
import {CDPCoverageCollector} from '@nullcc/code-coverage-client';

import type {Cookie} from '@wdio/protocols';
import type {ClickOptions, MockFilterOptions, WaitUntilOptions} from 'webdriverio';
import type {JsonCompatible} from '@wdio/types';
import type {RespondWithOptions} from 'webdriverio/build/utils/interception/types';
import webdriver from 'webdriver';
import {WebdriverIOConfig} from '@wdio/types/build/Capabilities';

// 导入统一的timeout配置
const TIMEOUTS = require('../../../e2e-test-app/timeout-config.js');

type BrowserObjectCustom = WebdriverIO.Browser & {
    sessionId: string;
};

type browserClientItem = {
    client: BrowserObjectCustom;
    sessionId: string;
    initTime: number;
    cdpCoverageCollector: CDPCoverageCollector | null;
};

const DEFAULT_CONFIG: SeleniumPluginConfig = {
    recorderExtension: false,
    clientCheckInterval: 5 * 1000,
    clientTimeout: TIMEOUTS.CLIENT_SESSION,
    port: 4444,
    logLevel: 'error',
    capabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: [] as string[],
        },
        'wdio:enforceWebDriverClassic': true,
    } as any,
    cdpCoverage: false,
    disableClientPing: false,
};

function delay(timeout: number) {
    return new Promise<void>((resolve) => setTimeout(() => resolve(), timeout));
}

function stringifyWindowFeatures(windowFeatures: WindowFeaturesConfig) {
    let result;
    if (typeof windowFeatures === 'string') {
        result = windowFeatures;
    } else {
        const features = windowFeatures as IWindowFeatures;
        result = Object.keys(features)
            .map((key) => `${key}=${features[key as keyof IWindowFeatures]}`)
            .join(',');
    }
    return result;
}

export class SeleniumPlugin implements IBrowserProxyPlugin {
    private logger = loggerClient.withPrefix('[selenium-browser-process]');

    private clientCheckInterval: NodeJS.Timer | undefined;

    private expiredBrowserClients: Set<string> = new Set();

    private browserClients: Map<string, browserClientItem> = new Map();

    private customBrowserClientsConfigs: Map<string, WebdriverIOConfig> = new Map();

    private waitForReadyState: Promise<void> = Promise.resolve();

    private localSelenium: ChildProcess | undefined;

    private config: SeleniumPluginConfig;

    private incrementWinId = 0;

    constructor(config: Partial<SeleniumPluginConfig> = {}) {
        this.config = this.createConfig(config);

        if (this.config.host === undefined) {
            this.runLocalSelenium();
        }

        this.initIntervals();
    }

    // eslint-disable-next-line sonarjs/cognitive-complexity
    private createConfig(
        config: Partial<SeleniumPluginConfig>,
    ): SeleniumPluginConfig {
        const mergedConfig = deepmerge.all<SeleniumPluginConfig>(
            [DEFAULT_CONFIG, config],
            {
                clone: true,
            },
        );

        if (!mergedConfig.hostname && mergedConfig.host) {
            mergedConfig.hostname = mergedConfig.host;
        }

        const capabilities = mergedConfig.capabilities as any;
        const googleChromeOptions = capabilities?.['goog:chromeOptions'];
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
        if (this.config.workerLimit !== 'local' && !this.config.disableClientPing) {
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
            this.localSelenium = spawnWithPipes('java', [
                ...this.getChromeDriverArgs(),
                '-jar',
                seleniumJarPath,
                '-port',
                this.config.port,
            ]);

            this.waitForReadyState = new Promise((resolve, reject) => {
                if (this.localSelenium?.stderr) {
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

    private getApplicantSessionId(applicant: string): string | undefined {
        const item = this.browserClients.get(applicant);
        return item?.sessionId;
    }

    private hasBrowserClient(applicant: string): boolean {
        return this.browserClients.has(applicant);
    }

    private getBrowserClient(applicant: string): BrowserObjectCustom {
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

    public setCustomBrowserClientConfig(
        applicant: string,
        config: WebdriverIOConfig,
    ) {
        this.customBrowserClientsConfigs.set(
            applicant,
            config
        );
    }

    public getCustomBrowserClientConfig(
        applicant: string,
    ) {
        return this.customBrowserClientsConfigs.get(applicant);
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
            this.customBrowserClientsConfigs.get(applicant) || {},
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

    private async enableCDPCoverageClient(client: BrowserObjectCustom) {
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
        // Empirically: pause after close() to let Selenium kill ChromeDriver cleanly (no zombie process).
        if (this.config.delayAfterSessionClose) {
            await delay(this.config.delayAfterSessionClose);
        }
        this.browserClients.delete(applicant);
        this.customBrowserClientsConfigs.delete(applicant);
    }

    public async kill() {
        this.logger.debug('Kill command is called');

        // Close all browser sessions
        for (const applicant of this.browserClients.keys()) {
            try {
                await this.end(applicant);
            } catch (e) {
                this.logger.error(e);
            }
        }

        // If using 'local' mode, stop all active sessions
        if (this.config.workerLimit === 'local') {
            await this.stopAllSessions();
        }

        if (this.localSelenium) {
            // remove listener
            if (this.localSelenium.stderr) {
                this.localSelenium.stderr.removeAllListeners('data');
                this.localSelenium.stdout?.removeAllListeners();
            }

            // Ensure all pipes are closed
            this.localSelenium.stdout?.destroy();
            this.localSelenium.stderr?.destroy();
            this.localSelenium.stdin?.destroy();

            this.logger.debug(
                `Stopping local Selenium server (PID: ${this.localSelenium.pid})`,
            );

            // Try SIGTERM first
            this.localSelenium.kill('SIGTERM');

            // Wait for exit event with a timeout (ensures it does not hang forever)
            const waitForExit = new Promise<void>((resolve) => {
                this.localSelenium?.once('exit', () => {
                    this.logger.debug('Selenium process exited.');
                    resolve();
                });
            });

            // Force kill if not exiting within 3 seconds
            const forceKill = new Promise<void>((resolve) => {
                setTimeout(() => {
                    if (this.localSelenium && !this.localSelenium.killed) {
                        this.logger.warn(
                            `Selenium did not exit in time. Sending SIGKILL.`,
                        );
                        this.localSelenium.kill('SIGKILL');
                    }
                    resolve();
                }, 3000);
            });

            // Wait for either normal exit or force kill
            await Promise.race([waitForExit, forceKill]);

            this.localSelenium.removeAllListeners();

            this.logger.debug(
                'Selenium process and all associated pipes closed.',
            );
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
        return options && Object.keys(options).length > 0
            ? element.click(options)
            : element.click();
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

    public async clearValue(applicant: string, xpath: string) {
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
            const firstKey = keys[0];
            if (firstKey === undefined) {
                return {ELEMENT: ''};
            }
            return {ELEMENT: o[firstKey]};
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
        await client.waitUntil(async () => body.isExisting(), {timeout: TIMEOUTS.WAIT_FOR_ELEMENT});

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

        const options: Partial<WaitUntilOptions> = {
            timeout: timeout || TIMEOUTS.CONDITION,
        };

        if (timeoutMsg !== undefined) {
            options.timeoutMsg = timeoutMsg;
        }

        if (interval !== undefined) {
            options.interval = interval;
        }

        return client.waitUntil(condition, options);
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

    public async gridTestSession(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (this.localSelenium) {
            return {
                sessionId: client.sessionId,
                host: this.config.host,
                port: this.config.port,
                localSelenium: true,
            };
        }

        return client.gridTestSession(client.sessionId);
    }

    public async getHubConfig(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (this.localSelenium) {
            return {
                sessionId: client.sessionId,
                host: this.config.host,
                port: this.config.port,
                localSelenium: true,
            };
        }

        return client.getHubConfig();
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

    public async emulateDevice(applicant: string, deviceName: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        await client.deleteSession();
        this.browserClients.delete(applicant);
        this.customBrowserClientsConfigs.delete(applicant);
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

    public async status(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.status();
    }

    public async back(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.back();
    }

    public async forward(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.forward();
    }

    public async getActiveElement(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.getActiveElement();
    }

    public async getLocation(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);
        const element = client.$(xpath);
        return element.getLocation();
    }

    public async setTimeZone(applicant: string, timeZone: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);
        return client.setTimeZone(timeZone);
    }

    public async getWindowSize(applicant: string): Promise<{width: number; height: number}> {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);
        return client.getWindowSize();
    }

    public async savePDF(applicant: string, options: SavePdfOptions) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const {filepath, ...restOptions} = options;

        return client.savePDF(filepath, restOptions);
    }

    public async addValue(
        applicant: string,
        xpath: string,
        value: string | number,
    ) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.addValue(value);
    }

    public async doubleClick(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.doubleClick();
    }

    public async isClickable(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.isClickable();
    }

    public async waitForClickable(
        applicant: string,
        xpath: string,
        timeout: number,
    ) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.waitForClickable({timeout});
    }

    public async isFocused(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.isFocused();
    }

    public async isStable(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.isStable();
    }

    public async waitForEnabled(
        applicant: string,
        xpath: string,
        timeout: number,
    ) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.waitForEnabled({timeout});
    }

    public async waitForStable(
        applicant: string,
        xpath: string,
        timeout: number,
    ) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        const selector = await client.$(xpath);
        return selector.waitForStable({timeout});
    }
}

export default function seleniumProxy(config: SeleniumPluginConfig) {
    return new SeleniumPlugin(config);
}
