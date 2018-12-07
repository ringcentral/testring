import * as deepmerge from 'deepmerge';
import { IBrowserProxyPlugin, WindowFeaturesConfig } from '@testring/types';
import { spawn } from '@testring/child-process';
import { Config, Client, RawResult, remote } from 'webdriverio';
import { SeleniumPluginConfig } from '../types';
import { ChildProcess } from 'child_process';
import { loggerClient } from '@testring/logger';

type browserClientItem = {
    client: Client<any>;
    sessionId: string;
    initTime: number;
};

const DEFAULT_CONFIG: SeleniumPluginConfig = {
    deprecationWarnings: false,
    clientCheckInterval: 5 * 1000,
    clientTimeout: 15 * 60 * 1000,
    port: 4444,
    desiredCapabilities: {
        browserName: 'chrome',
        chromeOptions: {
            args: []
        }
    }
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

export class SeleniumPlugin implements IBrowserProxyPlugin {
    private logger = loggerClient.withPrefix('[selenium-browser-process]');

    private clientCheckInterval: NodeJS.Timer;

    private expiredBrowserClients: Set<string> = new Set();

    private browserClients: Map<string, browserClientItem> = new Map();

    private waitForReadyState: Promise<void> = Promise.resolve();

    private localSelenium: ChildProcess;

    private config: SeleniumPluginConfig;

    constructor(config: Partial<SeleniumPluginConfig> = {}) {
        this.config = deepmerge.all([
            DEFAULT_CONFIG,
            config,
        ], {
            clone: true,
        });

        if (this.config.host === undefined) {
            this.runLocalSelenium();
        }

        this.initIntervals();
    }

    private initIntervals() {
        this.clientCheckInterval = setInterval(
            () => this.checkClientsTimeout(),
            this.config.clientCheckInterval
        );

        process.on('exit', () => {
            clearInterval(this.clientCheckInterval);
            this.stopAllSessions().catch((err) => {
                this.logger.error(err);
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
        const chromeDriver = require('chromedriver');

        return [`-Dwebdriver.chrome.driver=${chromeDriver.path}`];
    }

    private async runLocalSelenium() {
        const seleniumServer = require('selenium-server');
        const seleniumJarPath = seleniumServer.path;
        this.logger.debug('Init local selenium server');

        try {
            this.localSelenium = spawn('java', [
                ...this.getChromeDriverArgs(),
                '-jar', seleniumJarPath,
                '-port', this.config.port
            ]);

            this.waitForReadyState = new Promise((resolve) => {
                this.localSelenium.stderr.on('data', (data) => {
                    const message = data.toString();

                    this.logger.verbose('[selenium server]', message);

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
        const timeLimit = Date.now() - this.config.clientTimeout;

        for (let [applicant, clientData] of this.browserClients) {
            if (clientData.initTime < timeLimit) {
                this.logger.warn(`Stopped session applicant ${applicant} and marked as expired`);
                await this.end(applicant);
                this.expiredBrowserClients.add(applicant);
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
                this.logger.debug(`Stopping sessions for applicant ${applicant}. Session id:`, sessionID);
            } else {
                this.logger.warn(`Stopping sessions for applicant warning ${applicant}.`,
                    `Session ids are not equal, starting with - ${startingSessionID}, ending with - ${sessionID}`);
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
        for (const applicant of this.browserClients.keys()) {
            await this.end(applicant);
        }

        // safe buffer if clients are still active
        await delay(2000);

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
}

export default function seleniumProxy(config: Config) {
    return new SeleniumPlugin(config);
}
