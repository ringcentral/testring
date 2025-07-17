// TODO (flops) rework and merge with selenium backend
/* eslint-disable @typescript-eslint/no-shadow,@typescript-eslint/no-this-alias */
import * as url from 'url';
import {FSScreenshotFactory} from '@testring/fs-store';

import {
    IWebApplicationConfig,
    IAssertionErrorMeta,
    IAssertionSuccessMeta,
    ITransport,
    WindowFeaturesConfig,
    WebApplicationDevtoolActions,
    IWebApplicationRegisterMessage,
    IWebApplicationRegisterCompleteMessage,
    WebApplicationDevtoolCallback,
    ExtensionPostMessageTypes,
    FSFileLogType,
    SavePdfOptions,
} from '@testring/types';

import {asyncBreakpoints} from '@testring/async-breakpoints';
import {loggerClient, LoggerClient} from '@testring/logger';
import {generateUniqId} from '@testring/utils';
import {PluggableModule} from '@testring/pluggable-module';
import {createElementPath, ElementPathProxy} from '@testring/element-path';

import {createAssertion} from '@testring/async-assert';
import {WebClient} from './web-client';
import * as utils from './utils';
import {
    getOptionsPropertyScript,
    scrollIntoViewCallScript,
    scrollIntoViewIfNeededCallScript,
    simulateJSFieldChangeScript,
} from './browser-scripts';

// 导入统一的timeout配置
const TIMEOUTS = require('../../e2e-test-app/timeout-config.js');

type valueType = string | number | null | undefined;

type ClickOptions = {
    x?: number | 'left' | 'center' | 'right';
    y?: number | 'top' | 'center' | 'bottom';
};

type ElementPath = string | ElementPathProxy;

export class WebApplication extends PluggableModule {
    protected LOGGER_PREFIX = '[web-application]';

    protected WAIT_PAGE_LOAD_TIMEOUT: number = TIMEOUTS.PAGE_LOAD_MAX;

    protected WAIT_TIMEOUT = TIMEOUTS.WAIT_TIMEOUT;

    protected TICK_TIMEOUT = TIMEOUTS.TICK_TIMEOUT;

    protected config: IWebApplicationConfig;

    private screenshotsEnabledManually = true;

    public isLogOpened = false;

    public isSessionStopped = false;

    public mainTabID: string | null = null;

    public isRegisteredInDevtool = false;

    protected applicationId = `webApp-${generateUniqId()}`;

    public assert = createAssertion({
        onSuccess: (meta) => this.successAssertionHandler(meta),
        onError: (meta) => this.errorAssertionHandler(meta),
    });

    public softAssert = createAssertion({
        isSoft: true,
        onSuccess: (meta) => this.successAssertionHandler(meta),
        onError: (meta) => this.errorAssertionHandler(meta),
    });

    public root = createElementPath();

    public initPromise: Promise<any> = Promise.resolve();

    constructor(
        protected testUID: string,
        protected transport: ITransport,
        config: Partial<IWebApplicationConfig> = {},
    ) {
        super();
        this.config = this.getConfig(config);
        if (config.seleniumConfig) {
            this.initPromise = this.client.setCustomBrowserClientConfig(this.config.seleniumConfig);
        }
    }

    protected getConfig(
        userConfig: Partial<IWebApplicationConfig>,
    ): IWebApplicationConfig {
        return Object.assign(
            {},
            {
                screenshotsEnabled: false,
                screenshotPath: './_tmp/',
                devtool: null,
            },
            userConfig,
        );
    }

    protected async successAssertionHandler(meta: IAssertionSuccessMeta) {
        const {successMessage, assertMessage} = meta;
        const logger = this.logger;

        if (successMessage) {
            await logger.stepSuccess(successMessage, async () => {
                await this.makeScreenshot();
                await logger.debug(assertMessage);
            });
        } else {
            await logger.stepSuccess(assertMessage, async () => {
                await this.makeScreenshot();
            });
        }
    }

    protected async errorAssertionHandler(meta: IAssertionErrorMeta) {
        const {successMessage, assertMessage} = meta;
        const logger = this.logger;

        if (successMessage) {
            await logger.stepError(successMessage, async () => {
                await logger.error(assertMessage);
                await this.makeScreenshot();
            });
        } else {
            await logger.stepError(assertMessage, async () => {
                await this.makeScreenshot();
            });
        }
    }

    public get client(): WebClient {
        const applicationID = `${this.testUID}-${generateUniqId()}`;
        const value = new WebClient(applicationID, this.transport);

        Object.defineProperty(this, 'client', {
            value,
            enumerable: false,
            writable: true,
            configurable: true,
        });

        return value;
    }

    public get logger(): LoggerClient {
        const value = loggerClient.withPrefix(this.LOGGER_PREFIX);

        Object.defineProperty(this, 'logger', {
            value,
            enumerable: false,
            writable: true,
            configurable: true,
        });

        return value;
    }

    protected formatXpath(xpath: ElementPath): string {
        return utils.getFormattedString(xpath);
    }

    protected getRootSelector(): ElementPathProxy {
        return this.root as ElementPathProxy;
    }

    protected normalizeSelector(
        selector: ElementPath,
        allowMultipleNodesInResult = false,
    ): string {
        if (!selector) {
            return this.getRootSelector().toString();
        }

        return (selector as ElementPathProxy).toString(
            allowMultipleNodesInResult,
        );
    }

    protected async asyncErrorHandler(_error: Error) {
        await this.makeScreenshot();
    }

    protected errorHandler(error: Error) {
        this.logger.error(error);
    }

    protected async devtoolHighlight(
        xpath: ElementPath,
        multiple = false,
    ): Promise<void> {
        const normalizedXPath =
            xpath !== null ? this.normalizeSelector(xpath, multiple) : null;

        if (this.config.devtool) {
            try {
                await this.client.execute((addHighlightXpath: string) => {
                    window.postMessage(
                        {
                            type: ExtensionPostMessageTypes.CLEAR_HIGHLIGHTS,
                        },
                        '*',
                    );

                    if (addHighlightXpath) {
                        window.postMessage(
                            {
                                type: ExtensionPostMessageTypes.ADD_XPATH_HIGHLIGHT,
                                xpath: addHighlightXpath,
                            },
                            '*',
                        );
                    }
                }, normalizedXPath);
            } catch (e) {
                this.logger.error('Failed to highlight element:', e);
            }
        }
    }

    public getSoftAssertionErrors() {
        return [...this.softAssert._errorMessages];
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Waiting ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async waitForExist(
        xpath: ElementPath,
        timeout: number = this.WAIT_TIMEOUT,
        skipMoveToObject = false,
    ) {
        await this.devtoolHighlight(xpath);

        const normalizedXPath = this.normalizeSelector(xpath);
        const exists = await this.client.waitForExist(normalizedXPath, timeout);

        if (!skipMoveToObject) {
            try {
                await this.scrollIntoViewIfNeededCall(xpath);
                await this.client.moveToObject(normalizedXPath, 1, 1);
            } catch (ignore) {
                /* ignore */
            }
        }

        return exists;
    }

    @stepLog(function (this: WebApplication, timeout: number = this.WAIT_TIMEOUT) {
        return `Waiting for root element for ${timeout}`;
    })
    public async waitForRoot(timeout: number = this.WAIT_TIMEOUT) {
        const xpath = this.getRootSelector().toString();

        return this.client.waitForExist(xpath, timeout);
    }

    // TODO (flops) remove it and make extension via initCustomApp
    public extendInstance<O>(obj: O): this & O {
        return Object.assign(this, obj);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Waiting for not exists ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async waitForNotExists(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        let exists = false;

        try {
            xpath = this.normalizeSelector(xpath);
            await this.client.waitForExist(xpath, timeout);
            exists = true;
        } catch (ignore) {
            /* ignore */
        }

        if (exists) {
            throw new Error(
                `Wait for not exists failed, element ${this.formatXpath(
                    xpath,
                )} is exists`,
            );
        }

        return !exists;
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Waiting for visible ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async waitForVisible(
        xpath: ElementPath,
        timeout: number = this.WAIT_TIMEOUT,
        skipMoveToObject = false,
    ) {
        const startTime = Date.now();

        await this.waitForExist(xpath, timeout, skipMoveToObject);

        const spentTime = Date.now() - startTime;
        const waitTime = timeout - spentTime;

        if (waitTime <= 0) {
            throw new Error(
                `Wait for visible failed, element not exists after ${timeout}ms`,
            );
        }

        xpath = this.normalizeSelector(xpath);

        return this.client.waitForVisible(xpath, waitTime);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Waiting for not visible ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async waitForNotVisible(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        const path = this.formatXpath(xpath);
        const expires = Date.now() + timeout;

        xpath = this.normalizeSelector(xpath);

        try {
            await this.waitForRoot(timeout);
        } catch (error) {
            throw new Error(
                'Wait for not visible is failed, root element is still pending',
            );
        }

        while (expires - Date.now() >= 0) {
            const visible = await this.client.isVisible(xpath);

            if (!visible) {
                return false;
            }

            await this.pause(this.TICK_TIMEOUT);
        }

        throw new Error(
            'Wait for not visible failed, element ' + path + ' is visible',
        );
    }

    public async getTitle() {
        return this.client.getTitle();
    }

    public async logNavigatorVersion() {
        const userAgent = await this.execute(
            () => window.navigator && window.navigator.userAgent,
        );
        this.logger.debug(userAgent);
        return userAgent;
    }

    private async documentReadyWait() {
        const attemptCount = 1000;
        const attemptInterval = 200;

        let i = 0;
        let result = false;
        while (i < attemptCount) {
            const ready = await this.execute(
                () => document.readyState === 'complete',
            );

            if (ready) {
                result = true;
                break;
            } else {
                await this.pause(attemptInterval);
                i++;
            }
        }

        if (!result) {
            throw new Error('Failed to wait for the page load');
        }
    }

    private async openPageFromURI(uri: string) {
        const prevUrl: any = await this.url();

        if (url.parse(prevUrl).path === url.parse(uri).path) {
            await this.url(uri);
            await this.refresh();
            await this.logNavigatorVersion();
            await this.documentReadyWait();
        } else {
            await this.url(uri);
            await this.logNavigatorVersion();
            await this.documentReadyWait();
        }
    }

    @stepLog(function (this: WebApplication, page: string, timeout: number = this.WAIT_PAGE_LOAD_TIMEOUT) {
        return `Opening page ${page} for ${timeout}`;
    })
    public async openPage(
        page: string,
        timeout: number = this.WAIT_PAGE_LOAD_TIMEOUT,
    ): Promise<any> {
        let timer;

        const result = await Promise.race([
            this.openPageFromURI(page),
            new Promise((_resolve, reject) => {
                timer = setTimeout(
                    () => reject(new Error(`Page open timeout: ${page}`)),
                    timeout,
                );
            }),
        ]);

        clearTimeout(timer);

        return result;
    }

    
    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Checking if ${this.formatXpath(xpath)} is visible for ${timeout}`;
    })
    public async isBecomeVisible(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        const normalizedXpath = this.normalizeSelector(xpath);

        try {
            await this.client.waitForVisible(normalizedXpath, timeout);
            return true;
        } catch {
            return false;
        }
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Checking if ${this.formatXpath(xpath)} is hidden for ${timeout}`;
    })
    public async isBecomeHidden(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        const expires = Date.now() + timeout;
        const normalizedXpath = this.normalizeSelector(xpath);

        while (expires - Date.now() >= 0) {
            const visible = await this.client.isVisible(normalizedXpath);

            if (!visible) {
                return true;
            }

            await this.pause(this.TICK_TIMEOUT);
        }

        return false;
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Clicking for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async click(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        const normalizedSelector = this.normalizeSelector(xpath);

        await this.waitForExist(normalizedSelector, timeout);
        await this.makeScreenshot();

        return this.client.click(normalizedSelector, {x: 1, y: 1});
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Clicking button for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async clickButton(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        const normalizedSelector = this.normalizeSelector(xpath);

        await this.waitForExist(normalizedSelector, timeout);
        await this.makeScreenshot();

        return this.client.click(normalizedSelector, {button: 'left'});
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, _options: ClickOptions, timeout: number = this.WAIT_TIMEOUT) {
        return `Clicking coordinates for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async clickCoordinates(
        xpath: ElementPath,
        options: ClickOptions,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        const normalizedSelector = this.normalizeSelector(xpath);

        await this.waitForExist(normalizedSelector, timeout);
        await this.makeScreenshot();

        let hPos = 0;
        let vPos = 0;

        if (typeof options?.x === 'string' || typeof options?.y === 'string') {
            const {width, height} = await this.client.getSize(
                normalizedSelector,
            );

            switch (options?.x) {
                case 'left':
                    hPos = -Math.ceil(width / 2) + 1;
                    break;

                case 'right':
                    hPos = Math.ceil(width / 2) - 1;
                    break;

                case 'center':
                    hPos = 0;
                    break;

                default:
                    hPos = 0;
            }

            switch (options?.y) {
                case 'top':
                    vPos = -Math.ceil(height / 2) + 1;
                    break;

                case 'bottom':
                    vPos = Math.ceil(height / 2) - 1;
                    break;

                case 'center':
                    vPos = 0;
                    break;

                default:
                    vPos = 0;
            }
        }

        return this.client.click(normalizedSelector, {x: hPos, y: vPos});
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Getting size for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async getSize(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);

        const normalizedSelector = this.normalizeSelector(xpath);
        return this.client.getSize(normalizedSelector);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Getting value for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async getValue(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);

        const normalizedSelector = this.normalizeSelector(xpath);
        return this.client.getValue(normalizedSelector);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath) {
        return `Simulating JS field clear for ${this.formatXpath(xpath)}`;
    })
    public async simulateJSFieldClear(xpath: ElementPath) {
        return this.simulateJSFieldChange(xpath, '');
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, value: string) {
        return `Simulating JS field change for ${this.formatXpath(xpath)} with value ${value}`;
    })
    public async simulateJSFieldChange(xpath: ElementPath, value: string) {
        const result = await this.client.executeAsync(
            simulateJSFieldChangeScript,
            xpath,
            value,
        );

        if (result) {
            throw new Error(result);
        }
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, _emulateViaJs = false, timeout: number = this.WAIT_TIMEOUT) {
        return `Clearing element ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async clearElement(
        xpath: ElementPath,
        emulateViaJs = false,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);

        if (emulateViaJs) {
            return this.simulateJSFieldClear(xpath);
        }
        await this.client.setValue(xpath, '_');
        await this.waitForExist(xpath, timeout);
        return this.client.keys(['Backspace']);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Clearing value for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async clearValue(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);
        const normalizedXpath = this.normalizeSelector(xpath);
        return this.client.clearValue(normalizedXpath);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, value: valueType, _emulateViaJS = false, timeout: number = this.WAIT_TIMEOUT) {
        return `Setting value ${value} for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async setValue(
        xpath: ElementPath,
        value: valueType,
        emulateViaJS = false,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        if (value === '' || value === null || value === undefined) {
            await this.clearElement(xpath, emulateViaJS, timeout);
        } else {
            await this.waitForExist(xpath, timeout);
            xpath = this.normalizeSelector(xpath);

            if (emulateViaJS) {
                this.simulateJSFieldChange(xpath, value as string);

                this.logger.debug(
                    `Value ${value} was entered into ${this.formatXpath(
                        xpath,
                    )} using JS emulation`,
                );
            } else {
                await this.client.setValue(xpath, value);
                this.logger.debug(
                    `Value ${value} was entered into ${this.formatXpath(
                        xpath,
                    )} using Selenium`,
                );
            }
        }

        await this.makeScreenshot();
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, _trim = true, timeout: number = this.WAIT_TIMEOUT) {
        return `Getting text for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async getText(
        xpath: ElementPath,
        trim = true,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        await this.waitForExist(xpath, timeout);

        const text = (await this.getTextsInternal(xpath, trim)).join(' ');

        this.logger.debug(
            `Get text from ${this.formatXpath(xpath)} returns "${text}"`,
        );

        return text;
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Getting text without focus for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async getTextWithoutFocus(
        xpath: ElementPath,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        await this.waitForExist(xpath, timeout, true);

        const text = (await this.getTextsInternal(xpath, true)).join(' ');

        this.logger.debug(
            `Get tooltip text from ${this.formatXpath(
                xpath,
            )} returns "${text}"`,
        );
        return text;
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, _trim = true, timeout: number = this.WAIT_TIMEOUT) {
        return `Getting texts for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async getTexts(
        xpath: ElementPath,
        trim = true,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        await this.waitForExist(xpath, timeout);

        // Explicitly trigger mouse hover to ensure onmouseover events are fired
        try {
            await this.moveToObject(xpath, 1, 1);
        } catch (ignore) {
            // Ignore errors from moveToObject
        }

        const texts = await this.getTextsInternal(xpath, trim, true);

        this.logger.debug(
            `Get texts from ${this.formatXpath(xpath)} returns "${texts.join(
                '\n',
            )}"`,
        );
        return texts;
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, prop: string, timeout: number = this.WAIT_TIMEOUT) {
        return `Getting options property ${prop} for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async getOptionsProperty(
        xpath: ElementPath,
        prop: string,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);

        return this.client.executeAsync(getOptionsPropertyScript, xpath, prop);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, _trim = true, timeout: number = this.WAIT_TIMEOUT) {
        return `Getting select texts for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async getSelectTexts(
        xpath: ElementPath,
        trim = true,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        const texts: string[] = await this.getOptionsProperty(
            xpath,
            'text',
            timeout,
        );

        if (!texts) {
            return [];
        }

        if (trim) {
            return texts.map((item) => item.trim());
        }

        return texts;
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Getting select values for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async getSelectValues(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return (await this.getOptionsProperty(xpath, 'value', timeout)) || [];
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Selecting not current for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async selectNotCurrent(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        const options: any[] = await this.getSelectValues(xpath, timeout);
        const value: any = await this.client.getValue(
            this.normalizeSelector(xpath),
        );
        const index = options.indexOf(value);
        if (index > -1) {
            options.splice(index, 1);
        }
        await this.selectByValue(xpath, options[0]);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, value: string | number, timeout: number = this.WAIT_TIMEOUT) {
        return `Selecting by index "${value}" for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async selectByIndex(
        xpath: ElementPath,
        value: string | number,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        const logXpath = this.formatXpath(xpath);
        const errorMessage = `Could not select by index "${value}": ${logXpath}`;

        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath, timeout);

        try {
            return await this.client.selectByIndex(xpath, value);
        } catch (error) {
            (error as Error).message = errorMessage;
            throw error;
        }
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, value: string | number, timeout: number = this.WAIT_TIMEOUT) {
        return `Selecting by value "${value}" for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async selectByValue(
        xpath: ElementPath,
        value: string | number,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        const errorMessage = `Could not select by value "${value}": ${this.formatXpath(
            xpath,
        )}`;

        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath, timeout);

        try {
            return await this.client.selectByValue(xpath, value);
        } catch (error) {
            (error as Error).message = errorMessage;
            throw error;
        }
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, value: string | number, timeout: number = this.WAIT_TIMEOUT) {
        return `Selecting by visible text "${value}" for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async selectByVisibleText(
        xpath: ElementPath,
        value: string | number,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        const logXpath = this.formatXpath(xpath);
        const errorMessage = `Could not select by visible text "${value}": ${logXpath}`;

        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath, timeout);

        try {
            return await this.client.selectByVisibleText(xpath, String(value));
        } catch (error) {
            (error as Error).message = errorMessage;
            throw error;
        }
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Getting selected text for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async getSelectedText(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath, timeout);

        const value = await this.client.getValue(xpath);

        if (typeof value === 'string' || typeof value === 'number') {
            // TODO (flops) rework this for supporting custom selectors
            xpath += `//option[@value='${value}']`;

            try {
                const options = await this.client.getText(xpath);
                if (options instanceof Array) {
                    return options[0] || '';
                }
                return options || '';
            } catch (ignore) {
                /* ignore */
            }
        }
        return '';
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Getting elements IDs for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async getElementsIds(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        // TODO (flops) need to add log ?
        await this.waitForExist(xpath, timeout);
        const elements: any = await this.elements(xpath);
        const elementIds: any[] = [];

        for (let i = 0; i < elements.length; i++) {
            const elem: any = elements[i];
            elementIds.push(elem.ELEMENT);
        }

        return elementIds.length > 1 ? elementIds : elementIds[0];
    }

    @stepLog(function (this: WebApplication, elementId: string) {
        return `Checking if element ${elementId} is selected`;
    })
    public async isElementSelected(elementId: string) {
        // todo (flops) need to add log ?
        const elementSelected: any = await this.client.elementIdSelected(
            elementId.toString(),
        );

        return !!elementSelected;
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Checking if ${this.formatXpath(xpath)} is checked for ${timeout}`;
    })
    public async isChecked(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath, timeout);

        const isSelected = await this.client.isSelected(xpath);

        return !!isSelected;
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, checked = true, timeout: number = this.WAIT_TIMEOUT) {
        return `Setting checked state of ${this.formatXpath(xpath)} to ${checked} for ${timeout}`;
    })
    public async setChecked(
        xpath: ElementPath,
        checked = true,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath, timeout);

        const isChecked = await this.client.isSelected(xpath);

        if (!!isChecked !== !!checked) {
            return this.client.click(xpath);
        }
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Checking if ${this.formatXpath(xpath)} is visible for ${timeout}`;
    })
    public async isVisible(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForRoot(timeout);

        xpath = this.normalizeSelector(xpath);

        return this.client.isVisible(xpath);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, ...suitableClasses: string[]) {
        return `Checking if ${this.formatXpath(xpath)} has any of the classes ${suitableClasses.join(', ')}`;
    })
    public async isCSSClassExists(xpath: ElementPath, ...suitableClasses: string[]) {
        const elemClasses: any = await this.getAttribute(xpath, 'class');
        const elemClassesArr = (elemClasses || '')
            .trim()
            .toLowerCase()
            .split(/\s+/g);

        return suitableClasses.some((suitableClass) =>
            elemClassesArr.includes(suitableClass.toLowerCase()),
        );
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, attr: string, timeout: number = this.WAIT_TIMEOUT) {
        return `Getting attribute ${attr} of ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async getAttribute(
        xpath: ElementPath,
        attr: string,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath, timeout);

        return this.client.getAttribute(xpath, attr);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Checking if ${this.formatXpath(xpath)} is read only for ${timeout}`;
    })
    public async isReadOnly(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        const inputTags = ['input', 'select', 'textarea'];

        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath, timeout);

        const readonly: string = await this.client.getAttribute(
            xpath,
            'readonly',
        );
        const str: string = await this.client.getTagName(xpath);

        if (
            readonly === 'true' ||
            readonly === 'readonly' ||
            readonly === 'readOnly' ||
            inputTags.indexOf(str) === -1
        ) {
            return true;
        }

        const disabled: string = await this.client.getAttribute(
            xpath,
            'disabled',
        );

        return disabled === 'true' || disabled === 'disabled';
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Checking if ${this.formatXpath(xpath)} is enabled for ${timeout}`;
    })
    public async isEnabled(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);

        return this.client.isEnabled(xpath);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Checking if ${this.formatXpath(xpath)} is disabled for ${timeout}`;
    })
    public async isDisabled(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return !(await this.isEnabled(xpath, timeout));
    }

    @stepLog(function (this: WebApplication) {
        return 'Maximizing window';
    })
    public async maximizeWindow() {
        // TODO (flops) add log
        try {
            await this.client.windowHandleMaximize();
            return true;
        } catch (e) {
            this.logger.warn(`failed to maximize window, ${e}`);
            return false;
        }
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, x = 1, y = 1, _timeout: number = this.WAIT_TIMEOUT) {
        return `Moving to object ${this.formatXpath(xpath)} at ${x}, ${y}`;
    })
    public async moveToObject(
        xpath: ElementPath,
        x = 1,
        y = 1,
        _timeout: number = this.WAIT_TIMEOUT,
    ) {
        await this.scrollIntoViewIfNeeded(xpath);

        const normalizedXpath = this.normalizeSelector(xpath);
        return this.client.moveToObject(normalizedXpath, x, y);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, x = 0, y = 0, timeout: number = this.WAIT_TIMEOUT) {
        return `Scrolling ${this.formatXpath(xpath)} to ${x}, ${y} for ${timeout}`;
    })
    public async scroll(
        xpath: ElementPath,
        x = 0,
        y = 0,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        await this.waitForExist(xpath, timeout, true);

        xpath = this.normalizeSelector(xpath);

        return this.client.scroll(xpath, x, y);
    }

    // eslint-disable-next-line sonarjs/cognitive-complexity
    protected async scrollIntoViewCall(xpath: ElementPath, topOffset = 0, leftOffset = 0) {
        const normalizedXpath = this.normalizeSelector(xpath);

        if (topOffset || leftOffset) {
            const result = await this.client.executeAsync(
                scrollIntoViewCallScript,
                normalizedXpath,
                topOffset,
                leftOffset,
            );

            if (result) {
                throw new Error(result);
            }
        } else {
            return this.client.scrollIntoView(normalizedXpath);
        }
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, topOffset = 0, leftOffset = 0, timeout: number = this.WAIT_TIMEOUT) {
        return `Scrolling into view for ${this.formatXpath(xpath)} with top offset ${topOffset} and left offset ${leftOffset} for ${timeout}`;
    })
    public async scrollIntoView(
        xpath: ElementPath,
        topOffset?: number,
        leftOffset?: number,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        await this.waitForExist(xpath, timeout, true);

        await this.scrollIntoViewCall(xpath, topOffset, leftOffset);
    }

    // eslint-disable-next-line sonarjs/cognitive-complexity
    protected async scrollIntoViewIfNeededCall(
        xpath: ElementPath,
        topOffset = 0,
        leftOffset = 0,
    ) {
        const normalizedXpath = this.normalizeSelector(xpath);

        const result: string = await this.client.executeAsync(
            scrollIntoViewIfNeededCallScript,
            normalizedXpath,
            topOffset,
            leftOffset,
        );

        if (result) {
            throw new Error(result);
        }
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, topOffset = 0, leftOffset = 0, timeout: number = this.WAIT_TIMEOUT) {
        return `Scrolling into view if needed for ${this.formatXpath(xpath)} with top offset ${topOffset} and left offset ${leftOffset} for ${timeout}`;
    })
    public async scrollIntoViewIfNeeded(
        xpath: ElementPath,
        topOffset?: number,
        leftOffset?: number,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        await this.waitForExist(xpath, timeout, true);
        await this.scrollIntoViewIfNeededCall(xpath, topOffset, leftOffset);
    }

    @stepLog(function (this: WebApplication, xpathSource: ElementPath, xpathDestination: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Dragging and dropping ${this.formatXpath(xpathSource)} to ${this.formatXpath(xpathDestination)} for ${timeout}`;
    })
    public async dragAndDrop(
        xpathSource: ElementPath,
        xpathDestination: ElementPath,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        await this.waitForExist(xpathSource, timeout);
        await this.waitForExist(xpathDestination, timeout);

        xpathSource = this.normalizeSelector(xpathSource);
        xpathDestination = this.normalizeSelector(xpathDestination);

        return this.client.dragAndDrop(xpathSource, xpathDestination);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath) {
        return `Getting elements for ${this.formatXpath(xpath)}`;
    })
    public async elements(xpath: ElementPath) {
        await this.devtoolHighlight(xpath, true);

        const normalizedXpath = this.normalizeSelector(xpath, true);

        return this.client.elements(normalizedXpath);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Getting elements count for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async getElementsCount(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForRoot(timeout);

        const elements: any = await this.elements(xpath);

        return elements.length;
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Checking if elements do not exist for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async notExists(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        const elementsCount = await this.getElementsCount(
            this.normalizeSelector(xpath),
            timeout,
        );

        return elementsCount === 0;
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Checking if elements exist for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async isElementsExist(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        const elementsCount = await this.getElementsCount(
            this.normalizeSelector(xpath),
            timeout,
        );

        return elementsCount > 0;
    }

    @stepLog(function (this: WebApplication) {
        return 'Checking if alert is open';
    })
    public async isAlertOpen() {
        return this.client.isAlertOpen();
    }

    @stepLog(function (this: WebApplication, timeout: number = this.WAIT_TIMEOUT) {
        return `Accepting alert for ${timeout}`;
    })
    public async alertAccept(timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForAlert(timeout);
        return this.client.alertAccept();
    }

    @stepLog(function (this: WebApplication, timeout: number = this.WAIT_TIMEOUT) {
        return `Dismissing alert for ${timeout}`;
    })
    public async alertDismiss(timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForAlert(timeout);
        return this.client.alertDismiss();
    }

    @stepLog(function (this: WebApplication, timeout: number = this.WAIT_TIMEOUT) {
        return `Getting alert text for ${timeout}`;
    })
    public async alertText(timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForAlert(timeout);
        return this.client.alertText();
    }

    @stepLog(function (this: WebApplication, timeout: number = this.WAIT_TIMEOUT) {
        return `Waiting for alert for ${timeout}`;
    })
    public async waitForAlert(timeout: number = this.WAIT_TIMEOUT) {
        const waitUntil = Date.now() + timeout;

        let isAlertVisible = false;

        while (!isAlertVisible && Date.now() < waitUntil) {
            try {
                await this.client.alertText();
                isAlertVisible = true;
            } catch (e) {
                await this.pause(this.TICK_TIMEOUT);
                isAlertVisible = false;
            }
        }

        return isAlertVisible;
    }

    @stepLog(function (this: WebApplication, focusToTabId: string | null = null) {
        return `Closing browser window ${focusToTabId}`;
    })
    public async closeBrowserWindow(focusToTabId = null) {
        const mainTabID = await this.getMainTabId();
        const tabIds = await this.getTabIds();
        const tabId = focusToTabId || mainTabID;

        if (tabIds.length === 1 && tabIds[0] === tabId) {
            this.resetMainTabId();
        }

        return this.client.close(tabId as string);
    }

    @stepLog(function (this: WebApplication) {
        return 'Closing current tab';
    })
    public async closeCurrentTab() {
        const currentTabId = await this.getCurrentTabId();
        const mainTabID = await this.getMainTabId();

        await this.closeBrowserWindow(currentTabId);

        if (currentTabId === mainTabID) {
            const tabIds = await this.getTabIds();

            if (tabIds.length > 0) {
                await this.setActiveTab(tabIds[0]);
                this.mainTabID = tabIds[0];
            } else {
                await this.end();
            }
        } else {
            await this.switchToMainSiblingTab();
        }
    }

    @stepLog(function (this: WebApplication) {
        return 'Getting window handles';
    })
    public async windowHandles() {
        return this.client.windowHandles();
    }

    @stepLog(function (this: WebApplication, handle: string) {
        return `Switching to window ${handle}`;
    })
    public async window(handle: string) {
        await this.initMainTabId();
        return this.client.window(handle);
    }

    @stepLog(function (this: WebApplication, url: string, windowName: string, _windowFeatures: WindowFeaturesConfig = {}) {
        return `Opening new window ${windowName} for ${url}`;
    })
    public async newWindow(
        url: string,
        windowName: string,
        windowFeatures: WindowFeaturesConfig = {},
    ) {
        return this.client.newWindow(url, windowName, windowFeatures);
    }

    private resetMainTabId() {
        this.mainTabID = null;
    }

    protected async initMainTabId() {
        if (this.mainTabID === null) {
            this.mainTabID = await this.client.getCurrentTabId();
        }
    }

    @stepLog(function (this: WebApplication) {
        return 'Getting main tab ID';
    })
    public async getMainTabId() {
        await this.initMainTabId();

        return this.mainTabID;
    }

    @stepLog(function (this: WebApplication) {
        return 'Getting tab IDs';
    })
    public async getTabIds() {
        return this.client.getTabIds();
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Getting HTML of ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async getHTML(xpath: ElementPath, timeout = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);

        return this.client.getHTML(xpath, {prettify: false});
    }

    @stepLog(function (this: WebApplication) {
        return 'Getting current tab ID';
    })
    public async getCurrentTabId() {
        return this.client.getCurrentTabId();
    }

    @stepLog(function (this: WebApplication, tabId: string) {
        return `Switching to tab ${tabId}`;
    })
    public async switchTab(tabId: string) {
        await this.initMainTabId();
        return this.client.switchTab(tabId);
    }

    @stepLog(function (this: WebApplication) {
        return 'Closing all other tabs';
    })
    public async closeAllOtherTabs() {
        const tabIds: any = await this.getTabIds();
        const mainTabId = await this.getMainTabId();

        for (const tabId of tabIds) {
            if (tabId !== mainTabId) {
                await this.window(tabId);
                await this.closeBrowserWindow(tabId);
            }
        }
        await this.switchToMainSiblingTab();
    }

    @stepLog(function (this: WebApplication, tabId: string) {
        return `Switching to tab ${tabId}`;
    })
    public async setActiveTab(tabId: string) {
        await this.window(tabId);
    }

    @stepLog(function (this: WebApplication) {
        return 'Closing first sibling tab';
    })
    public async closeFirstSiblingTab() {
        await this.switchToFirstSiblingTab();
        await this.closeCurrentTab();
        await this.switchToMainSiblingTab();
    }

    @stepLog(function (this: WebApplication) {
        return 'Switching to first sibling tab';
    })
    public async switchToFirstSiblingTab() {
        const mainTabID = await this.getMainTabId();
        const tabIds: Array<string> = await this.getTabIds();
        const siblingTabs = tabIds.filter((tabId) => tabId !== mainTabID);

        if (siblingTabs.length === 0) {
            return false;
        }

        await this.setActiveTab(siblingTabs[0] as string);
        return true;
    }

    @stepLog(function (this: WebApplication) {
        return 'Switching to main sibling tab';
    })
    public async switchToMainSiblingTab() {
        const mainTabID = await this.getMainTabId();
        const tabIds: Array<string> = await this.getTabIds();
        const mainTab = tabIds.find((tabId: string) => tabId === mainTabID);

        if (mainTab) {
            await this.setActiveTab(mainTab);
            return true;
        } else if (tabIds.length > 0) {
            await this.setActiveTab(tabIds[0] as string);
        }

        return false;
    }

    @stepLog(function (this: WebApplication, cookieObj: any) {
        return `Setting cookie ${cookieObj}`;
    })
    public setCookie(cookieObj: any) {
        return this.client.setCookie(cookieObj);
    }

    @stepLog(function (this: WebApplication, cookieName?: string) {
        return `Getting cookie ${cookieName || 'all'}`;
    })
    public getCookie(cookieName?: string) {
        return this.client.getCookie(cookieName);
    }

    @stepLog(function (this: WebApplication, cookieName: string) {
        return `Deleting cookie ${cookieName}`;
    })
    public deleteCookie(cookieName: string) {
        return this.client.deleteCookie(cookieName);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath) {
        return `Getting placeholder value of ${this.formatXpath(xpath)}`;
    })
    public getPlaceHolderValue(xpath: ElementPath) {
        return this.getAttribute(xpath, 'placeholder');
    }

    @stepLog(function (this: WebApplication, name: string) {
        return `Switching to frame ${name}`;
    })
    async switchToFrame(name: string) {
        return this.client.frame(name);
    }

    @stepLog(function (this: WebApplication) {
        return 'Switching to parent frame';
    })
    public async switchToParentFrame() {
        return this.client.frameParent();
    }

    private async getTextsInternal(
        xpath: ElementPath,
        trim: boolean,
        allowMultipleNodesInResult = false,
    ) {
        await this.devtoolHighlight(xpath, allowMultipleNodesInResult);

        const normalizedXpath = this.normalizeSelector(
            xpath,
            allowMultipleNodesInResult,
        );

        const elements: any = await this.client.elements(normalizedXpath);
        const result: Array<string> = [];

        for (const item of elements) {
            const response: any = await this.client.elementIdText(item.ELEMENT);

            if (trim) {
                result.push(response.trim());
            } else {
                result.push(response);
            }
        }

        return result;
    }

    @stepLog(function (this: WebApplication, _fn: (...args: any[]) => any, ..._args: any[]) {
        return 'Executing JavaScript function in browser console';
    })
    public execute(fn: (...args: any[]) => any, ...args: any[]) {
        return this.client.execute(fn, ...args);
    }

    @stepLog(function (this: WebApplication, timeout: number) {
        return `Pausing for ${timeout}ms`;
    })
    public pause(timeout: number) {
        this.logger.verbose(`delay for ${timeout}ms`);

        return new Promise((resolve) => setTimeout(resolve, timeout));
    }

    private async registerAppInDevtool(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const removeListener = this.transport.on(
                WebApplicationDevtoolActions.registerComplete,
                (message: IWebApplicationRegisterCompleteMessage) => {
                    if (message.id === this.applicationId) {
                        if (
                            message.error === null ||
                            message.error === undefined
                        ) {
                            resolve();
                        } else {
                            reject(message.error);
                        }
                        removeListener();
                    }
                },
            );

            const payload: IWebApplicationRegisterMessage = {
                id: this.applicationId,
            };

            this.transport.broadcastUniversally(
                WebApplicationDevtoolActions.register,
                payload,
            );
        });
    }

    private async unregisterAppInDevtool(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const removeListener =
                this.transport.on<IWebApplicationRegisterCompleteMessage>(
                    WebApplicationDevtoolActions.unregisterComplete,
                    // eslint-disable-next-line sonarjs/no-identical-functions
                    (message) => {
                        if (message.id === this.applicationId) {
                            if (
                                message.error === null ||
                                message.error === undefined
                            ) {
                                resolve();
                            } else {
                                reject(message.error);
                            }
                            removeListener();
                        }
                    },
                );

            const payload: IWebApplicationRegisterMessage = {
                id: this.applicationId,
            };

            this.transport.broadcastUniversally(
                WebApplicationDevtoolActions.unregister,
                payload,
            );
        });
    }

    private async extensionHandshake() {
        if (this.config.devtool !== null && !this.isRegisteredInDevtool) {
            const id = this.applicationId;

            this.logger.debug(
                `WebApplication ${id} devtool initial registration`,
            );
            await this.registerAppInDevtool();

            const {extensionId, httpPort, wsPort, host} = this.config.devtool;
            const url = `chrome-extension://${extensionId}/options.html?httpPort=${httpPort}&host=${host}&wsPort=${wsPort}&appId=${id}&page=handshake`;

            await this.client.url(url);

            await this.client.executeAsync(function (
                done: WebApplicationDevtoolCallback,
            ) {
                (window as any).resolveWebApp = done;
                done(null);
            });

            this.isRegisteredInDevtool = true;
        }
    }

    @stepLog(function (this: WebApplication, val?: string) {
        return `Navigating to ${val}`;
    })
    public async url(val?: string) {
        await this.extensionHandshake();
        return this.client.url(val);
    }

    @stepLog(function (this: WebApplication, value: string | string[]) {
        return `Sending keys ${value}`;
    })
    public keys(value: string | string[]) {
        this.logger.debug(`Send keys ${value}`);

        return this.client.keys(value);
    }

    @stepLog(function (this: WebApplication) {
        return `Refreshing page`;
    })
    public refresh() {
        return this.client.refresh();
    }

    public async disableScreenshots() {
        this.logger.debug(
            'Screenshots were disabled. DO NOT FORGET to turn them on back!',
        );
        this.screenshotsEnabledManually = false;
    }

    public async enableScreenshots() {
        this.logger.debug('Screenshots were enabled');
        this.screenshotsEnabledManually = true;
    }

    public async makeScreenshot(force = false): Promise<string | null> {
        if (
            this.config.screenshotsEnabled &&
            (this.screenshotsEnabledManually || force)
        ) {
            const screenshot = await this.client.makeScreenshot();
            const filePath = await FSScreenshotFactory().write(
                Buffer.from(screenshot.toString(), 'base64'),
            );

            this.logger.file(filePath, {type: FSFileLogType.SCREENSHOT});
            return filePath;
        }
        return null;
    }

    @stepLog(function (this: WebApplication, fullPath: string) {
        return `Uploading file ${fullPath}`;
    })
    public uploadFile(fullPath: string) {
        return this.client.uploadFile(fullPath);
    }

    public isStopped(): boolean {
        return this.isSessionStopped;
    }

    @stepLog(function (this: WebApplication) {
        return `Ending session`;
    })
    public async end() {
        if (this.config.devtool !== null && this.isRegisteredInDevtool) {
            await this.unregisterAppInDevtool();
        }

        this.resetMainTabId();
        await this.client.end();
        this.isSessionStopped = true;
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, cssProperty: string, timeout: number = this.WAIT_TIMEOUT) {
        return `Getting CSS property "${cssProperty}" of ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async getCssProperty(
        xpath: ElementPath,
        cssProperty: string,
        timeout: number = this.WAIT_TIMEOUT,
    ): Promise<any> {
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);
        return await this.client.getCssProperty(xpath, cssProperty);
    }

    @stepLog(function (this: WebApplication) {
        return `Getting source`;
    })
    public async getSource() {
        return await this.client.getSource();
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath) {
        return `Checking if ${this.formatXpath(xpath)} exists`;
    })
    public async isExisting(xpath: ElementPath) {
        xpath = this.normalizeSelector(xpath);
        return await this.client.isExisting(xpath);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT, reverse = false) {
        return `Waiting for ${this.formatXpath(xpath)} to be selected for ${timeout} with reverse ${reverse}`;
    })
    public async waitForValue(
        xpath: ElementPath,
        timeout: number = this.WAIT_TIMEOUT,
        reverse = false,
    ) {
        xpath = this.normalizeSelector(xpath);
        return await this.client.waitForValue(xpath, timeout, reverse);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT, reverse = false) {
        return `Waiting for ${this.formatXpath(xpath)} to be selected for ${timeout} with reverse ${reverse}`;
    })
    public async waitForSelected(
        xpath: ElementPath,
        timeout: number = this.WAIT_TIMEOUT,
        reverse = false,
    ) {
        xpath = this.normalizeSelector(xpath);
        return await this.client.waitForSelected(xpath, timeout, reverse);
    }

    @stepLog(function (this: WebApplication, condition: () => boolean | Promise<boolean>, timeout: number = this.WAIT_TIMEOUT, timeoutMsg = 'Wait by condition failed!', interval = 500) {
        return `Waiting until ${condition} for ${timeout} with timeout message "${timeoutMsg}" and interval ${interval}`;
    })
    public async waitUntil(
        condition: () => boolean | Promise<boolean>,
        timeout: number = this.WAIT_TIMEOUT,
        timeoutMsg = 'Wait by condition failed!',
        interval = 500,
    ) {
        return await this.client.waitUntil(
            condition,
            timeout,
            timeoutMsg,
            interval,
        );
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, attribute: string, value: string, timeout: number = this.WAIT_TIMEOUT) {
        return `Selecting by attribute "${attribute}" with value "${value}" for ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async selectByAttribute(
        xpath: ElementPath,
        attribute: string,
        value: string,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        const logXpath = this.formatXpath(xpath);
        const errorMessage = `Could not select by attribute "${attribute}" with value "${value}": ${logXpath}`;

        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath, timeout);

        try {
            return await this.client.selectByAttribute(xpath, attribute, value);
        } catch (error) {
            (error as Error).message = errorMessage;
            throw error;
        }
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Getting location of ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async getLocation(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);
        return await this.client.getLocation(xpath);
    }

    @stepLog(function (this: WebApplication) {
        return `Getting active element`;
    })
    public async getActiveElement() {
        return await this.client.getActiveElement();
    }

    @stepLog(function (this: WebApplication, timezone: string) {
        return `Setting timezone to ${timezone}`;
    })
    public async setTimeZone(timezone: string) {
        return this.client.setTimeZone(timezone);
    }

    @stepLog(function (this: WebApplication) {
        return `Getting window size`;
    })
    public async getWindowSize() {
        return this.client.getWindowSize();
    }

    public async savePDF(options: SavePdfOptions) {
        if (!options.filepath) {
            throw new Error('Filepath is not defined');
        }
        return this.client.savePDF(options);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, value: string | number, timeout: number = this.WAIT_TIMEOUT) {
        return `Adding value ${value} to ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async addValue(
        xpath: ElementPath,
        value: string | number,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        await this.waitForExist(xpath, timeout);
        xpath = this.normalizeSelector(xpath);
        return this.client.addValue(xpath, value);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Double clicking ${this.formatXpath(xpath)} for ${timeout}`;
    })
    public async doubleClick(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);
        xpath = this.normalizeSelector(xpath);
        return this.client.doubleClick(xpath);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Waiting for ${this.formatXpath(xpath)} to be clickable for ${timeout}`;
    })
    public async waitForClickable(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        xpath = this.normalizeSelector(xpath);
        return this.client.waitForClickable(xpath, timeout);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, _timeout: number = this.WAIT_TIMEOUT) {
        return `Checking if ${this.formatXpath(xpath)} is clickable`;
    })
    public async isClickable(xpath: ElementPath, _timeout: number = this.WAIT_TIMEOUT) {
        xpath = this.normalizeSelector(xpath);
        return this.client.isClickable(xpath);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Waiting for ${this.formatXpath(xpath)} to be enabled for ${timeout}`;
    })
    public async waitForEnabled(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        xpath = this.normalizeSelector(xpath);
        return this.client.waitForEnabled(xpath, timeout);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        return `Waiting for ${this.formatXpath(xpath)} to be stable for ${timeout}`;
    })
    public async waitForStable(xpath: ElementPath, timeout: number = this.WAIT_TIMEOUT) {
        xpath = this.normalizeSelector(xpath);
        return this.client.waitForStable(xpath, timeout);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath) {
        return `Checking if ${this.formatXpath(xpath)} is focused`;
    })
    public async isFocused(xpath: ElementPath) {
        xpath = this.normalizeSelector(xpath);
        return this.client.isFocused(xpath);
    }

    @stepLog(function (this: WebApplication, xpath: ElementPath) {
        return `Checking if ${this.formatXpath(xpath)} is stable`;
    })
    public async isStable(xpath: ElementPath) {
        xpath = this.normalizeSelector(xpath);
        return this.client.isStable(xpath);
    }
}

function stepLog<T extends (...args: any[]) => any>(
    logFn: (...args: Parameters<T>) => string
) {
    return function (
        _target: any,
        _propertyKey: string,
        descriptor: TypedPropertyDescriptor<T>
    ) {
        const originalMethod = descriptor.value!;
        descriptor.value = function (this: WebApplication, ...args: Parameters<T>): ReturnType<T> {
            const self = this;
            let errorLogInterceptor: (err: Error, ...args: any[]) => string = (err) => err.message;
            // eslint-disable-next-line no-async-promise-executor
            const promise = new Promise<any>(async (resolve, reject) => {
                await self.initPromise;
                const logger = self.logger;
                const message = logFn.apply(self, args);
                let result;
                if (self.isLogOpened) {
                    logger.debug(message);
                    try {
                        resolve(await originalMethod.apply(self, args));
                    } catch (err: any) {
                        err.message = errorLogInterceptor(err, ...args);
                        reject(err);
                    }
                } else {
                    await asyncBreakpoints.waitBeforeInstructionBreakpoint(
                        (state) => {
                            if (state) {
                                logger.debug(
                                    'Debug: Stopped in breakpoint before instruction execution',
                                );
                            }
                        },
                    );
                    logger.startStep(message);
                    self.isLogOpened = true;
                    try {
                        result = originalMethod.apply(self, args);
                        if (result && result.catch && typeof result.catch === 'function') {
                            result
                                .catch(async (err: any) => {
                                    err.message = errorLogInterceptor(err, ...args);
                                    await self.asyncErrorHandler(err);
                                    logger.endStep(message);
                                    self.isLogOpened = false;
                                    reject(err);
                                })
                                .then((result: any) => {
                                    logger.endStep(message);
                                    self.isLogOpened = false;
                                    resolve(result);
                                });
                        } else {
                            logger.endStep(message);
                            self.isLogOpened = false;
                        }
                    } catch (err: any) {
                        err.message = errorLogInterceptor(err, ...args);
                        self.errorHandler(err);
                        logger.endStep(message);
                        self.isLogOpened = false;
                        reject(err);
                    }
                    await asyncBreakpoints.waitAfterInstructionBreakpoint(
                        (state) => {
                            if (state) {
                                logger.debug(
                                    'Debug: Stopped in breakpoint after instruction execution',
                                );
                            }
                        },
                    );
                    resolve(result);
                }
            });
            Object.defineProperty(promise, 'ifError', {
                value: (
                    interceptor: string | ((err: Error, ...args: any[]) => string),
                ) => {
                    if (typeof interceptor === 'function') {
                        errorLogInterceptor = interceptor;
                    } else if (interceptor === null || interceptor === undefined) {
                        return Promise.reject('Error interceptor can not be empty');
                    } else {
                        errorLogInterceptor = () => interceptor.toString();
                    }
                    return promise;
                },
                enumerable: false,
                writable: false,
                configurable: false,
            });
            return promise as ReturnType<T>;
        } as T;
        return descriptor;
    };
}
