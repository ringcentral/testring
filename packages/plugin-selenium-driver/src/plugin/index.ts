import {SeleniumPluginConfig, SeleniumVersion} from '../types';
import {
    IBrowserProxyPlugin,
    SavePdfOptions,
    WindowFeaturesConfig,
    IWindowFeatures,
    Selector,
    ShadowCssSelector,
    isXpathSelector,
    isShadowCssSelector
} from '@testring/types';

import {ChildProcess} from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

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
    clientTimeout: 15 * 60 * 1000,
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
    localVersion: 'v3' as SeleniumVersion,
    seleniumArgs: [],
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

function getSeleniumJarPath(version: SeleniumVersion): string {
    if (version === 'v4') {
        // For Selenium v4, we expect the JAR to be in a specific location
        const seleniumV4Path = path.join(__dirname, '..', 'selenium-server-v4', 'selenium-server-4.34.0.jar');
        
        if (!fs.existsSync(seleniumV4Path)) {
            throw new Error(
                `Selenium v4 JAR not found at expected path: ${seleniumV4Path}. ` +
                'Please ensure selenium-server-4.34.0.jar is available in the package directory.'
            );
        }
        
        return seleniumV4Path;
    }
    
    // For v3 and other versions, use the original logic
    const seleniumServer = require('selenium-server');
    return seleniumServer.path;
}


function setupProcessListeners(
    seleniumProcess: ChildProcess,
    resolve: () => void,
    reject: (error: Error) => void,
    version: SeleniumVersion,
    logger: { verbose: (message: string) => void }
) {
    if (!seleniumProcess.stderr && !seleniumProcess.stdout) {
        reject(new Error('There is no STDERR or STDOUT on selenium worker'));
        return;
    }

    let isReady = false;
    const timeout = setTimeout(() => {
        if (!isReady) {
            reject(new Error(`Selenium server failed to start within 30 seconds (version: ${version})`));
        }
    }, 30000);

    // Check for server readiness
    const readyMessages: Record<SeleniumVersion, string> = {
        v4: 'Started Selenium Standalone',
        v3: 'SeleniumServer.boot',
    };

    const checkForReadyMessage = (message: string, stream: 'stdout' | 'stderr') => {
        logger.verbose(`[Selenium ${version}] [${stream.toUpperCase()}] ${message.trim()}`);
        
        if (message.includes(readyMessages[version])) {
            isReady = true;
            clearTimeout(timeout);
            setTimeout(resolve, 500); // Small delay to ensure server is fully ready
        }
    };

    // For v4, ready message appears in stdout
    if (version === 'v4') {
        seleniumProcess.stdout?.on('data', (data) => {
            checkForReadyMessage(data.toString(), 'stdout');
        });
        
        // Also listen to stderr for error messages
        seleniumProcess.stderr?.on('data', (data) => {
            logger.verbose(`[Selenium ${version}] [STDERR] ${data.toString().trim()}`);
        });
    } else {
        // For v3, ready message appears in stderr
        seleniumProcess.stderr?.on('data', (data) => {
            checkForReadyMessage(data.toString(), 'stderr');
        });
        
        // Also listen to stdout for other messages
        seleniumProcess.stdout?.on('data', (data) => {
            logger.verbose(`[Selenium ${version}] [STDOUT] ${data.toString().trim()}`);
        });
    }

    seleniumProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Selenium process error: ${error.message}`));
    });

    seleniumProcess.on('exit', (code) => {
        if (!isReady) {
            clearTimeout(timeout);
            reject(new Error(`Selenium process exited with code ${code} before becoming ready`));
        }
    });
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
            this.setupProcessCleanup();
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

    private setupProcessCleanup() {
        process.on('SIGINT', () => this.forceKillSelenium());
        process.on('SIGTERM', () => this.forceKillSelenium());
        process.on('SIGKILL', () => this.forceKillSelenium());
    }

    private forceKillSelenium() {
        if (this.localSelenium && !this.localSelenium.killed) {
            this.logger.debug('Force killing Selenium process due to signal');
            this.localSelenium.kill('SIGKILL');
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

    private getChromeDriverPath() {
        if (this.config.chromeDriverPath) {
            return this.config.chromeDriverPath;
        }
        
        return require('chromedriver').path;
    }

    private getChromeDriverArgs() {
        const chromeDriverPath = this.getChromeDriverPath();

        return [`-Dwebdriver.chrome.driver=${chromeDriverPath}`];
    }

    private buildSeleniumArgs(seleniumJarPath: string, version: SeleniumVersion, port: number, chromeDriverArgs: string[]): string[] {
        const args = [...chromeDriverArgs];
        
        if (version === 'v4') {
            args.push(
                '-jar', 
                seleniumJarPath, 
                'standalone', 
                '--port', 
                port.toString(),
                '--bind-host',
                'false',
            );
        } else {
            args.push('-jar', seleniumJarPath, '-port', port.toString());
        }
        
        // Append custom selenium arguments if provided
        if (this.config.seleniumArgs && this.config.seleniumArgs.length > 0) {
            args.push(...this.config.seleniumArgs);
        }
        
        return args;
    }

    private async runLocalSelenium() {
        const version = this.config.localVersion || 'v3';
        this.logger.debug(`Init local selenium server (version: ${version})`);

        try {
            const seleniumJarPath = getSeleniumJarPath(version);
            const chromeDriverArgs = this.getChromeDriverArgs();
            const seleniumArgs = this.buildSeleniumArgs(seleniumJarPath, version, this.config.port || 4444, chromeDriverArgs);
            
            this.logger.debug(`Starting Selenium with command: java ${seleniumArgs.join(' ')}`);
            
            this.localSelenium = spawnWithPipes('java', seleniumArgs);

            this.waitForReadyState = new Promise((resolve, reject) => {
                if (this.localSelenium) {
                    setupProcessListeners(this.localSelenium, resolve, reject, version, this.logger);
                } else {
                    reject(new Error('Failed to spawn Selenium process'));
                }
            });

            // Wait for the server to be ready
            await this.waitForReadyState;
            this.logger.debug(`Selenium server (${version}) is ready`);
            
        } catch (err) {
            this.logger.error(`Local selenium server init failed (version: ${version})`, err);
            throw err; // Re-throw to allow upstream error handling
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

    private async getElement(applicant: string, selector: Selector) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (isXpathSelector(selector)) {
            return client.$(selector.xpath);
        } else if (isShadowCssSelector(selector)) {
            return this.getElementFromShadowCss(client, selector);
        }
        
        throw new Error('Unknown selector type');
    }

    private async getElementFromShadowCss(client: BrowserObjectCustom, selector: ShadowCssSelector) {
        const {css, parentSelectors} = selector;
        
        // Error first: validate selector structure
        this.validateShadowCssSelector(selector);

        try {
            return await this.traverseShadowDom(client, css, parentSelectors);
        } catch (error) {
            // Provide more context in error messages
            if (error instanceof Error) {
                throw new Error(`Shadow DOM traversal failed: ${error.message}. Selector: ${JSON.stringify(selector)}`);
            }
            throw error;
        }
    }

    private validateShadowCssSelector(selector: ShadowCssSelector): void {
        const {css, parentSelectors} = selector;
        
        if (!css || typeof css !== 'string') {
            throw new Error('Shadow CSS selector must have a valid CSS string');
        }
        
        if (!Array.isArray(parentSelectors) || parentSelectors.length === 0) {
            throw new Error('Shadow CSS selector must have at least one parent selector');
        }
        
        // Validate all parent selectors are non-empty strings
        for (const [index, parentSelector] of parentSelectors.entries()) {
            if (!parentSelector || typeof parentSelector !== 'string') {
                throw new Error(`Parent selector at index ${index} must be a non-empty string`);
            }
        }
    }

    private async traverseToLastParentSelector(client: BrowserObjectCustom, parentSelectors: string[]) {
        const [firstParentSelector, ...restParentSelectors] = parentSelectors;
        
        // TypeScript assertion: we know firstParentSelector exists due to validation
        if (!firstParentSelector) {
            throw new Error('First parent selector is required');
        }
        
        // Get the first parent element
        let currentElement = await client.$(firstParentSelector);
        
        if (!currentElement) {
            throw new Error(`Failed to find parent element with selector: ${firstParentSelector}`);
        }

        // Traverse through shadow DOM hierarchy
        for (const parentSelector of restParentSelectors) {
            const shadowElement = await currentElement.shadow$(parentSelector);
            if (!shadowElement) {
                throw new Error(`Failed to find shadow element with selector: ${parentSelector}`);
            }
            currentElement = shadowElement;
        }

        return currentElement;
    }

    private async traverseShadowDom(client: BrowserObjectCustom, css: string, parentSelectors: string[]) {
        // Traverse to the last parent selector
        const lastParentElement = await this.traverseToLastParentSelector(client, parentSelectors);

        // Get the final target element within the shadow DOM
        const targetElement = await lastParentElement.shadow$(css);
        if (!targetElement) {
            throw new Error(`Failed to find target element with CSS selector: ${css}`);
        }

        return targetElement;
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
        selector: Selector,
        options?: ClickOptions,
    ) {
        const element = await this.getElement(applicant, selector);
        return options && Object.keys(options).length > 0
            ? element.click(options)
            : element.click();
    }

    public async getSize(applicant: string, selector: Selector) {
        const element = await this.getElement(applicant, selector);
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
        selector: Selector,
        timeout: number,
    ) {
        const element = await this.getElement(applicant, selector);
        return element.waitForExist({timeout});
    }

    public async waitForVisible(
        applicant: string,
        selector: Selector,
        timeout: number,
    ) {
        const element = await this.getElement(applicant, selector);
        return element.waitForDisplayed({timeout});
    }

    public async isVisible(applicant: string, selector: Selector) {
        const element = await this.getElement(applicant, selector);
        return element.isDisplayed();
    }

    public async moveToObject(
        applicant: string,
        selector: Selector,
        xOffset = 0,
        yOffset = 0,
    ) {
        const element = await this.getElement(applicant, selector);
        return element.moveTo({xOffset, yOffset});
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

    public async clearValue(applicant: string, selector: Selector) {
        const element = await this.getElement(applicant, selector);
        return element.clearValue();
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

    public async elements(applicant: string, selector: Selector) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        if (isXpathSelector(selector)) {
            const elements = (await client.findElements('xpath', selector.xpath)) as unknown;
            return (elements as Array<Record<string, string>>).map((o) => {
                const keys = Object.keys(o);
                const firstKey = keys[0];
                if (firstKey === undefined) {
                    return {ELEMENT: ''};
                }
                return {ELEMENT: o[firstKey]};
            });
        } else if (isShadowCssSelector(selector)) {
            const lastParentElement = await this.traverseToLastParentSelector(client, selector.parentSelectors);
            const elements = lastParentElement.shadow$$(selector.css);
            return elements.map((element) => {
                return {ELEMENT: element.elementId};
            });
        }
        
        throw new Error('Unknown selector type');
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

    public async getValue(applicant: string, selector: Selector) {
        const element = await this.getElement(applicant, selector);
        return element.getValue();
    }

    public async setValue(applicant: string, selector: Selector, value: any) {
        const element = await this.getElement(applicant, selector);
        return element.setValue(value);
    }

    public async selectByIndex(applicant: string, selector: Selector, value: any) {
        const element = await this.getElement(applicant, selector);
        return element.selectByIndex(value);
    }

    public async selectByValue(applicant: string, selector: Selector, value: any) {
        const element = await this.getElement(applicant, selector);
        return element.selectByAttribute('value', value);
    }

    public async selectByVisibleText(
        applicant: string,
        selector: Selector,
        str: string,
    ) {
        const element = await this.getElement(applicant, selector);
        return element.selectByVisibleText(str);
    }

    public async getAttribute(
        applicant: string,
        selector: Selector,
        attr: string,
    ): Promise<any> {
        const element = await this.getElement(applicant, selector);
        return element.getAttribute(attr);
    }

    public async windowHandleMaximize(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.maximizeWindow();
    }

    public async isEnabled(applicant: string, selector: Selector) {
        const element = await this.getElement(applicant, selector);
        return element.isEnabled();
    }

    public async scroll(
        applicant: string,
        selector: Selector,
        xOffset: number,
        yOffset: number,
    ) {
        const element = await this.getElement(applicant, selector);
        await element.scrollIntoView();
        return element.moveTo({xOffset, yOffset});
    }

    public async scrollIntoView(
        applicant: string,
        selector: Selector,
        scrollIntoViewOptions?: boolean | null,
    ) {
        const element = await this.getElement(applicant, selector);
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
        sourceSelector: Selector,
        destinationSelector: Selector,
    ) {
        const sourceElement = await this.getElement(applicant, sourceSelector);
        const destinationElement = await this.getElement(applicant, destinationSelector);
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

    public async getHTML(applicant: string, selector: Selector, b: any) {
        const element = await this.getElement(applicant, selector);
        return element.getHTML(b);
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

    public async getTagName(applicant: string, selector: Selector) {
        const element = await this.getElement(applicant, selector);
        return element.getTagName();
    }

    public async isSelected(applicant: string, selector: Selector) {
        const element = await this.getElement(applicant, selector);
        return element.isSelected();
    }

    public async getText(applicant: string, selector: Selector) {
        const element = await this.getElement(applicant, selector);
        return element.getText();
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
        selector: Selector,
        cssProperty: string,
    ): Promise<any> {
        const element = await this.getElement(applicant, selector);
        const property = await element.getCSSProperty(cssProperty);
        return property.value;
    }

    public async getSource(applicant: string) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.getPageSource();
    }

    public async isExisting(applicant: string, selector: Selector) {
        const element = await this.getElement(applicant, selector);
        return element.isExisting();
    }

    public async waitForValue(
        applicant: string,
        selector: Selector,
        timeout: number,
        reverse: boolean,
    ) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.waitUntil(
            async () => {
                const element = await this.getElement(applicant, selector);
                const elemValue = await element.getValue();
                return reverse ? !elemValue : !!elemValue;
            },
            {timeout},
        );
    }

    public async waitForSelected(
        applicant: string,
        selector: Selector,
        timeout: number,
        reverse: boolean,
    ) {
        await this.createClient(applicant);
        const client = this.getBrowserClient(applicant);

        return client.waitUntil(
            async () => {
                const element = await this.getElement(applicant, selector);
                const isSelected = await element.isSelected();
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
            timeout: timeout || 5000,
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
        selector: Selector,
        attribute: string,
        value: string,
    ) {
        const element = await this.getElement(applicant, selector);
        return element.selectByAttribute(attribute, value);
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

    public async getLocation(applicant: string, selector: Selector) {
        const element = await this.getElement(applicant, selector);
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
        selector: Selector,
        value: string | number,
    ) {
        const element = await this.getElement(applicant, selector);
        return element.addValue(value);
    }

    public async doubleClick(applicant: string, selector: Selector) {
        const element = await this.getElement(applicant, selector);
        return element.doubleClick();
    }

    public async isClickable(applicant: string, selector: Selector) {
        const element = await this.getElement(applicant, selector);
        return element.isClickable();
    }

    public async waitForClickable(
        applicant: string,
        selector: Selector,
        timeout: number,
    ) {
        const element = await this.getElement(applicant, selector);
        return element.waitForClickable({timeout});
    }

    public async isFocused(applicant: string, selector: Selector) {
        const element = await this.getElement(applicant, selector);
        return element.isFocused();
    }

    public async isStable(applicant: string, selector: Selector) {
        const element = await this.getElement(applicant, selector);
        return element.isStable();
    }

    public async waitForEnabled(
        applicant: string,
        selector: Selector,
        timeout: number,
    ) {
        const element = await this.getElement(applicant, selector);
        return element.waitForEnabled({timeout});
    }

    public async waitForStable(
        applicant: string,
        selector: Selector,
        timeout: number,
    ) {
        const element = await this.getElement(applicant, selector);
        return element.waitForStable({timeout});
    }
}

export default function seleniumProxy(config: SeleniumPluginConfig) {
    return new SeleniumPlugin(config);
}
