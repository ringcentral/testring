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

type valueType = string | number | null | undefined;

type ClickOptions = {
    x?: number | 'left' | 'center' | 'right';
    y?: number | 'top' | 'center' | 'bottom';
};

export class WebApplication extends PluggableModule {
    protected LOGGER_PREFIX = '[web-application]';

    protected WAIT_PAGE_LOAD_TIMEOUT: number = 3 * 60000;

    protected WAIT_TIMEOUT = 30000;

    protected TICK_TIMEOUT = 100;

    protected config: IWebApplicationConfig;

    private screenshotsEnabledManually = true;

    private isLogOpened = false;

    private isSessionStopped = false;

    private mainTabID: number | null = null;

    private isRegisteredInDevtool = false;

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

    static stepLogMessagesDecorator = {
        waitForRoot(timeout: number = this.WAIT_TIMEOUT) {
            return `Waiting for root element for ${timeout}`;
        },
        waitForExist(xpath, timeout: number = this.WAIT_TIMEOUT) {
            return `Waiting ${this.formatXpath(xpath)} for ${timeout}`;
        },
        waitForNotExists(xpath, timeout: number = this.WAIT_TIMEOUT) {
            return `Waiting not exists ${this.formatXpath(
                xpath,
            )} for ${timeout}`;
        },
        waitForNotVisible(xpath, timeout: number = this.WAIT_TIMEOUT) {
            return `Waiting for not visible ${this.formatXpath(
                xpath,
            )} for ${timeout}`;
        },
        waitForVisible(xpath, timeout: number = this.WAIT_TIMEOUT) {
            return `Waiting for visible ${this.formatXpath(
                xpath,
            )} for ${timeout}`;
        },
        openPage(uri: string) {
            if (typeof uri === 'string') {
                return `Opening page uri: ${uri}`;
            }
            return 'Opening page';
        },
        isBecomeVisible(xpath, timeout: number = this.WAIT_TIMEOUT) {
            return `Waiting for become visible ${this.formatXpath(
                xpath,
            )} for ${timeout}`;
        },
        isBecomeHidden(xpath, timeout: number = this.WAIT_TIMEOUT) {
            return `Waiting for become hidden ${this.formatXpath(
                xpath,
            )} for ${timeout}`;
        },
        click(xpath) {
            return `Click on ${this.formatXpath(xpath)}`;
        },
        clickButton(xpath) {
            return `Click on ${this.formatXpath(xpath)} in the middle`;
        },
        clickCoordinates(xpath, options: ClickOptions) {
            return `Click on ${this.formatXpath(xpath)} in ${JSON.stringify(
                options || {x: 1, y: 1},
            )}`;
        },
        clickHiddenElement(xpath) {
            return `Make ${this.formatXpath(xpath)} visible and click`;
        },
        getValue(xpath) {
            return `Get value from ${this.formatXpath(xpath)}`;
        },
        setValue(xpath, value: valueType) {
            return `Set value ${value} to ${this.formatXpath(xpath)}`;
        },
        getText(xpath) {
            return `Get text from ${this.formatXpath(xpath)}`;
        },
        getTooltipText(xpath) {
            return `Get tooltip text from ${this.formatXpath(xpath)}`;
        },
        getTexts(xpath) {
            return `Get texts from ${this.formatXpath(xpath)}`;
        },
        getOptionsProperty(xpath, prop: string) {
            return `Get options ${prop} ${this.formatXpath(xpath)}`;
        },
        selectByIndex(xpath, value: string | number) {
            return `Select by index ${this.formatXpath(xpath)} ${value}`;
        },
        selectByValue(xpath, value: string | number) {
            return `Select by value ${this.formatXpath(xpath)} ${value}`;
        },
        selectByVisibleText(xpath, value: string | number) {
            return `Select by visible text ${this.formatXpath(xpath)} ${value}`;
        },
        getSelectedText(xpath) {
            return `Get selected text ${this.formatXpath(xpath)}`;
        },
        isChecked(xpath) {
            return `Is checked ${this.formatXpath(xpath)}`;
        },
        setChecked(xpath, checked = true) {
            return `Set checked ${this.formatXpath(xpath)} ${!!checked}`;
        },
        isVisible(xpath) {
            return `Is visible ${this.formatXpath(xpath)}`;
        },
        rootlessIsVisible(xpath) {
            return `Is visible ${this.formatXpath(xpath)}`;
        },
        rootlessWaitForVisible(xpath) {
            return `Is visible ${this.formatXpath(xpath)}`;
        },
        getAttribute(xpath, attr: string) {
            return `Get attribute ${attr} from ${this.formatXpath(xpath)}`;
        },
        isDisabled(xpath) {
            return `Is disabled ${this.formatXpath(xpath)}`;
        },
        isReadOnly(xpath) {
            return `Is read only ${this.formatXpath(xpath)}`;
        },
        isEnabled(xpath) {
            return `Get attributes 'enabled' from ${this.formatXpath(xpath)}`;
        },
        isCSSClassExists(xpath, ...suitableClasses) {
            return `Checking classes ${suitableClasses.join(
                ', ',
            )} is\\are exists in ${this.formatXpath(xpath)}`;
        },
        moveToObject(xpath, x = 1, y = 1) {
            return `Move cursor to ${this.formatXpath(
                xpath,
            )} points (${x}, ${y})`;
        },
        scroll(xpath, x = 1, y = 1) {
            return `Scroll ${this.formatXpath(xpath)} to (${x}, ${y})`;
        },
        dragAndDrop(xpathSource, xpathDestination) {
            return `dragAndDrop ${this.formatXpath(
                xpathSource,
            )} to ${this.formatXpath(xpathDestination)}`;
        },
        elements(xpath) {
            return `elements ${this.formatXpath(xpath)}`;
        },
        getElementsCount(xpath) {
            return `Get elements count ${this.formatXpath(xpath)}`;
        },
        getHTML(xpath) {
            return `Get HTML from ${this.formatXpath(xpath)}`;
        },
        setActiveTab(tabId: number) {
            return `Switching to tab ${tabId}`;
        },
        clearElement(xpath) {
            return `Clear element ${this.formatXpath(xpath)}`;
        },
        getCssProperty(xpath, cssProperty) {
            return `Get CSS property ${cssProperty} from ${this.formatXpath(
                xpath,
            )}`;
        },
        getSource() {
            return 'Get source of current page';
        },
        waitForValue(
            xpath,
            timeout: number = this.WAIT_TIMEOUT,
            reverse: boolean,
        ) {
            if (reverse) {
                return `Waiting for element ${this.formatXpath(
                    xpath,
                )} doesn't has value for ${timeout}`;
            }
            return `Waiting for any value of ${this.formatXpath(
                xpath,
            )} for ${timeout}`;
        },
        waitForSelected(
            xpath,
            timeout: number = this.WAIT_TIMEOUT,
            reverse: boolean,
        ) {
            if (reverse) {
                return `Waiting for element ${this.formatXpath(
                    xpath,
                )} isn't selected for ${timeout}`;
            }
            return `Waiting for element ${this.formatXpath(
                xpath,
            )} is selected for ${timeout}`;
        },
        waitUntil(
            condition,
            timeout: number = this.WAIT_TIMEOUT,
            timeoutMsg?: string,
            interval?: number,
        ) {
            return `Waiting by condition for ${timeout}`;
        },
        selectByAttribute(xpath, attribute: string, value: string) {
            return `Select by attribute ${attribute} with value ${value} from ${xpath}`;
        },
        getLocation(xpath) {
            return `Get location from ${this.formatXpath(xpath)}`;
        },
        getActiveElement() {
            return 'Get active element';
        },
        setTimeZone(timezone: string) {
            return `Set browser timezone to ${timezone}`;
        },
        getWindowSize() {
            return 'Get window size';
        },
        savePDF(options: SavePdfOptions) {
            return `Save PDF to ${options.filepath}`;
        },
        addValue(xpath, value: string | number) {
            return `Add value ${value} to ${this.formatXpath(xpath)}`;
        },
        doubleClick(xpath) {
            return `Double click on ${this.formatXpath(xpath)}`;
        },
        waitForClickable(xpath, timeout = this.WAIT_TIMEOUT) {
            return `Wait for clickable ${this.formatXpath(
                xpath,
            )} for ${timeout}`;
        },
        isClickable(xpath) {
            return `Is clickable ${this.formatXpath(xpath)}`;
        },
        isFocused(xpath) {
            return `Is focused ${this.formatXpath(xpath)}`;
        },
        isStable(xpath) {
            return `Is stable ${this.formatXpath(xpath)}`;
        },
        waitForEnabled(xpath, timeout = this.WAIT_TIMEOUT) {
            return `Wait for enabled ${this.formatXpath(xpath)} for ${timeout}`;
        },
        waitForStable(xpath, timeout = this.WAIT_TIMEOUT) {
            return `Wait for stable ${this.formatXpath(xpath)} for ${timeout}`;
        },
    };
    private initPromise: Promise<any> = Promise.resolve();

    constructor(
        protected testUID: string,
        protected transport: ITransport,
        config: Partial<IWebApplicationConfig> = {},
    ) {
        super();
        this.config = this.getConfig(config);
        this.decorateMethods();
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

    // eslint-disable-next-line sonarjs/cognitive-complexity
    protected decorateMethods() {
        const decorators = (this.constructor as any).stepLogMessagesDecorator;

        // Reset isLogOpened on init, and bypass tslint
        if (this.isLogOpened) {
            this.isLogOpened = false;
        }

        const promiseGetter = (self, logFn, errorFn, originMethod, args) => {
            let errorLogInterceptor: (err: Error, ...args: any) => string =
                errorFn;

            // eslint-disable-next-line no-async-promise-executor
            const promise = new Promise(async (resolve, reject) => {
                await this.initPromise;
                const logger = self.logger;
                const message = logFn.apply(self, args);
                let result;

                if (self.isLogOpened) {
                    logger.debug(message);
                    try {
                        resolve(await originMethod.apply(self, args));
                    } catch (err) {
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
                        result = originMethod.apply(self, args);

                        if (
                            result &&
                            result.catch &&
                            typeof result.catch === 'function'
                        ) {
                            result
                                .catch(async (err) => {
                                    err.message = errorLogInterceptor(
                                        err,
                                        ...args,
                                    );

                                    await self.asyncErrorHandler(err);
                                    logger.endStep(message);
                                    self.isLogOpened = false;

                                    reject(err);
                                })
                                .then((result) => {
                                    logger.endStep(message);
                                    self.isLogOpened = false;

                                    resolve(result);
                                });
                        } else {
                            logger.endStep(message);
                            self.isLogOpened = false;
                        }
                    } catch (err) {
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
                    interceptor:
                        | string
                        | ((err: Error, ...args: any) => string),
                ) => {
                    if (typeof interceptor === 'function') {
                        errorLogInterceptor = interceptor;
                    } else if (
                        interceptor === null ||
                        interceptor === undefined
                    ) {
                        return Promise.reject(
                            'Error interceptor can not be empty',
                        );
                    } else {
                        errorLogInterceptor = () => interceptor.toString();
                    }

                    return promise;
                },
                enumerable: false,
                writable: false,
                configurable: false,
            });

            return promise;
        };

        for (const key in decorators) {
            ((key) => {
                if (Object.prototype.hasOwnProperty.call(decorators, key)) {
                    const context = this;
                    const originMethod = this[key];
                    let logFn;
                    let errorFn;

                    if (typeof decorators[key] === 'function') {
                        logFn = decorators[key];
                        errorFn = (err) => err.message;
                    } else {
                        logFn = decorators[key].log;
                        errorFn = decorators[key].error;
                    }

                    const method = (...args) => {
                        return promiseGetter(
                            context,
                            logFn,
                            errorFn,
                            originMethod,
                            args,
                        );
                    };

                    Object.defineProperty(method, 'originFunction', {
                        value: originMethod,
                        enumerable: false,
                        writable: false,
                        configurable: false,
                    });

                    Object.defineProperty(this, key, {
                        value: method,
                        enumerable: false,
                        writable: true,
                        configurable: true,
                    });
                }
            })(key);
        }
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

    protected formatXpath(xpath): string {
        return utils.getFormattedString(xpath);
    }

    protected getRootSelector(): ElementPathProxy {
        return this.root as ElementPathProxy;
    }

    protected normalizeSelector(
        selector: string | ElementPathProxy,
        allowMultipleNodesInResult = false,
    ): string {
        if (!selector) {
            return this.getRootSelector().toString();
        }

        return (selector as ElementPathProxy).toString(
            allowMultipleNodesInResult,
        );
    }

    protected async asyncErrorHandler(error) {
        await this.makeScreenshot();
    }

    protected errorHandler(error) {
        this.logger.error(error);
    }

    protected async devtoolHighlight(
        xpath: string | ElementPathProxy | null,
        multiple = false,
    ): Promise<void> {
        const normalizedXPath =
            xpath !== null ? this.normalizeSelector(xpath, multiple) : null;

        if (this.config.devtool) {
            try {
                await this.client.execute((addHighlightXpath) => {
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

    public async waitForExist(
        xpath,
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

    public async waitForRoot(timeout: number = this.WAIT_TIMEOUT) {
        const xpath = this.getRootSelector().toString();

        return this.client.waitForExist(xpath, timeout);
    }

    // TODO (flops) remove it and make extension via initCustomApp
    public extendInstance<O>(obj: O): this & O {
        return Object.assign(this, obj);
    }

    public async waitForNotExists(xpath, timeout: number = this.WAIT_TIMEOUT) {
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

    public async waitForVisible(
        xpath,
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

    public async waitForNotVisible(xpath, timeout: number = this.WAIT_TIMEOUT) {
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

    private async openPageFromURI(uri) {
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

    public async openPage(
        page: string,
        timeout: number = this.WAIT_PAGE_LOAD_TIMEOUT,
    ): Promise<any> {
        let timer;

        const result = await Promise.race([
            this.openPageFromURI(page),
            new Promise((resolve, reject) => {
                timer = setTimeout(
                    () => reject(new Error(`Page open timeout: ${page}`)),
                    timeout,
                );
            }),
        ]);

        clearTimeout(timer);

        return result;
    }

    public async isBecomeVisible(xpath, timeout: number = this.WAIT_TIMEOUT) {
        const normalizedXpath = this.normalizeSelector(xpath);

        try {
            await this.client.waitForVisible(normalizedXpath, timeout);
            return true;
        } catch {
            return false;
        }
    }

    public async isBecomeHidden(xpath, timeout: number = this.WAIT_TIMEOUT) {
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

    public async click(xpath, timeout: number = this.WAIT_TIMEOUT) {
        const normalizedSelector = this.normalizeSelector(xpath);

        await this.waitForExist(normalizedSelector, timeout);
        await this.makeScreenshot();

        return this.client.click(normalizedSelector, {x: 1, y: 1});
    }

    public async clickButton(xpath, timeout: number = this.WAIT_TIMEOUT) {
        const normalizedSelector = this.normalizeSelector(xpath);

        await this.waitForExist(normalizedSelector, timeout);
        await this.makeScreenshot();

        return this.client.click(normalizedSelector, {button: 'left'});
    }

    public async clickCoordinates(
        xpath,
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

    public async getSize(xpath, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);

        const normalizedSelector = this.normalizeSelector(xpath);
        return this.client.getSize(normalizedSelector);
    }

    public async getValue(xpath, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);

        const normalizedSelector = this.normalizeSelector(xpath);
        return this.client.getValue(normalizedSelector);
    }

    public async simulateJSFieldClear(xpath) {
        return this.simulateJSFieldChange(xpath, '');
    }

    // eslint-disable-next-line sonarjs/cognitive-complexity
    public async simulateJSFieldChange(xpath, value) {
        /* eslint-disable object-shorthand, no-var */
        const result = await this.client.executeAsync(
            simulateJSFieldChangeScript,
            xpath,
            value,
        );

        if (result) {
            throw new Error(result);
        }
        /* eslint-enable object-shorthand, no-var */
    }

    public async clearElement(
        xpath,
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

    public async clearValue(xpath, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);
        const normalizedXpath = this.normalizeSelector(xpath);
        return this.client.clearValue(normalizedXpath);
    }

    public async setValue(
        xpath,
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
                this.simulateJSFieldChange(xpath, value);

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

    public async getText(
        xpath,
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

    public async getTextWithoutFocus(
        xpath,
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

    public async getTexts(
        xpath,
        trim = true,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        await this.waitForExist(xpath, timeout);

        const texts = await this.getTextsInternal(xpath, trim, true);

        this.logger.debug(
            `Get texts from ${this.formatXpath(xpath)} returns "${texts.join(
                '\n',
            )}"`,
        );
        return texts;
    }

    public async getOptionsProperty(
        xpath,
        prop: string,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);

        return this.client.executeAsync(getOptionsPropertyScript, xpath, prop);
    }

    public async getSelectTexts(
        xpath,
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

    public async getSelectValues(xpath, timeout: number = this.WAIT_TIMEOUT) {
        return (await this.getOptionsProperty(xpath, 'value', timeout)) || [];
    }

    public async selectNotCurrent(xpath, timeout: number = this.WAIT_TIMEOUT) {
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

    public async selectByIndex(
        xpath,
        value: string | number,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        const logXpath = this.formatXpath(xpath);
        const errorMessage = `Could not select by index "${value}": ${logXpath}`;

        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath, timeout);

        try {
            return await this.client.selectByIndex(xpath, value);
        } catch (e) {
            e.message = errorMessage;
            throw e;
        }
    }

    public async selectByValue(
        xpath,
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
            error.message = errorMessage;
            throw error;
        }
    }

    public async selectByVisibleText(
        xpath,
        value: string | number,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        const logXpath = this.formatXpath(xpath);
        const errorMessage = `Could not select by visible text "${value}": ${logXpath}`;

        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath, timeout);

        try {
            return await this.client.selectByVisibleText(xpath, String(value));
        } catch (e) {
            e.message = errorMessage;
            throw e;
        }
    }

    public async getSelectedText(xpath, timeout: number = this.WAIT_TIMEOUT) {
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

    public async getElementsIds(xpath, timeout: number = this.WAIT_TIMEOUT) {
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

    public async isElementSelected(elementId) {
        // todo (flops) need to add log ?
        const elementSelected: any = await this.client.elementIdSelected(
            elementId.toString(),
        );

        return !!elementSelected;
    }

    public async isChecked(xpath, timeout: number = this.WAIT_TIMEOUT) {
        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath, timeout);

        const isSelected = await this.client.isSelected(xpath);

        return !!isSelected;
    }

    public async setChecked(
        xpath,
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

    public async isVisible(xpath, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForRoot(timeout);

        xpath = this.normalizeSelector(xpath);

        return this.client.isVisible(xpath);
    }

    public async isCSSClassExists(xpath, ...suitableClasses) {
        const elemClasses: any = await this.getAttribute(xpath, 'class');
        const elemClassesArr = (elemClasses || '')
            .trim()
            .toLowerCase()
            .split(/\s+/g);

        return suitableClasses.some((suitableClass) =>
            elemClassesArr.includes(suitableClass.toLowerCase()),
        );
    }

    public async getAttribute(
        xpath,
        attr: string,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath, timeout);

        return this.client.getAttribute(xpath, attr);
    }

    public async isReadOnly(xpath, timeout: number = this.WAIT_TIMEOUT) {
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

    public async isEnabled(xpath, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);

        return this.client.isEnabled(xpath);
    }

    public async isDisabled(xpath, timeout: number = this.WAIT_TIMEOUT) {
        return !(await this.isEnabled(xpath, timeout));
    }

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

    public async moveToObject(
        xpath,
        x = 1,
        y = 1,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        await this.scrollIntoViewIfNeeded(xpath);

        const normalizedXpath = this.normalizeSelector(xpath);
        return this.client.moveToObject(normalizedXpath, x, y);
    }

    public async scroll(
        xpath,
        x = 0,
        y = 0,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        await this.waitForExist(xpath, timeout, true);

        xpath = this.normalizeSelector(xpath);

        return this.client.scroll(xpath, x, y);
    }

    // eslint-disable-next-line sonarjs/cognitive-complexity
    protected async scrollIntoViewCall(xpath, topOffset = 0, leftOffset = 0) {
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

    public async scrollIntoView(
        xpath,
        topOffset?: number,
        leftOffset?: number,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        await this.waitForExist(xpath, timeout, true);

        await this.scrollIntoViewCall(xpath, topOffset, leftOffset);
    }

    // eslint-disable-next-line sonarjs/cognitive-complexity
    protected async scrollIntoViewIfNeededCall(
        xpath,
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

    public async scrollIntoViewIfNeeded(
        xpath,
        topOffset?: number,
        leftOffset?: number,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        await this.waitForExist(xpath, timeout, true);
        await this.scrollIntoViewIfNeededCall(xpath, topOffset, leftOffset);
    }

    public async dragAndDrop(
        xpathSource,
        xpathDestination,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        await this.waitForExist(xpathSource, timeout);
        await this.waitForExist(xpathDestination, timeout);

        xpathSource = this.normalizeSelector(xpathSource);
        xpathDestination = this.normalizeSelector(xpathDestination);

        return this.client.dragAndDrop(xpathSource, xpathDestination);
    }

    public async elements(xpath) {
        await this.devtoolHighlight(xpath, true);

        const normalizedXpath = this.normalizeSelector(xpath, true);

        return this.client.elements(normalizedXpath);
    }

    public async getElementsCount(xpath, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForRoot(timeout);

        const elements: any = await this.elements(xpath);

        return elements.length;
    }

    public async notExists(xpath, timeout: number = this.WAIT_TIMEOUT) {
        const elementsCount = await this.getElementsCount(
            this.normalizeSelector(xpath),
            timeout,
        );

        return elementsCount === 0;
    }

    public async isElementsExist(xpath, timeout: number = this.WAIT_TIMEOUT) {
        const elementsCount = await this.getElementsCount(
            this.normalizeSelector(xpath),
            timeout,
        );

        return elementsCount > 0;
    }

    public async isAlertOpen() {
        return this.client.isAlertOpen();
    }

    public async alertAccept(timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForAlert(timeout);
        return this.client.alertAccept();
    }

    public async alertDismiss(timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForAlert(timeout);
        return this.client.alertDismiss();
    }

    public async alertText(timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForAlert(timeout);
        return this.client.alertText();
    }

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

    public async closeBrowserWindow(focusToTabId = null) {
        const mainTabID = await this.getMainTabId();
        const tabIds = await this.getTabIds();
        const tabId = focusToTabId || mainTabID;

        if (tabIds.length === 1 && tabIds[0] === tabId) {
            this.resetMainTabId();
        }

        return this.client.close(tabId);
    }

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

    public async windowHandles() {
        return this.client.windowHandles();
    }

    public async window(handle) {
        await this.initMainTabId();
        return this.client.window(handle);
    }

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

    public async getMainTabId() {
        await this.initMainTabId();

        return this.mainTabID;
    }

    public async getTabIds() {
        return this.client.getTabIds();
    }

    public async getHTML(xpath, timeout = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);

        return this.client.getHTML(xpath, {prettify: false});
    }

    public async getCurrentTabId() {
        return this.client.getCurrentTabId();
    }

    public async switchTab(tabId) {
        await this.initMainTabId();
        return this.client.switchTab(tabId);
    }

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

    public async setActiveTab(tabId: number | null) {
        await this.window(tabId);
    }

    public async closeFirstSiblingTab() {
        await this.switchToFirstSiblingTab();
        await this.closeCurrentTab();
        await this.switchToMainSiblingTab();
    }

    public async switchToFirstSiblingTab() {
        const mainTabID = await this.getMainTabId();
        const tabIds: Array<number> = await this.getTabIds();
        const siblingTabs = tabIds.filter((tabId) => tabId !== mainTabID);

        if (siblingTabs.length === 0) {
            return false;
        }

        await this.setActiveTab(siblingTabs[0]);
        return true;
    }

    public async switchToMainSiblingTab() {
        const mainTabID = await this.getMainTabId();
        const tabIds: any = await this.getTabIds();
        const mainTab = tabIds.find((tabId) => tabId === mainTabID);

        if (mainTab) {
            await this.setActiveTab(mainTab);
            return true;
        } else if (tabIds.length > 0) {
            await this.setActiveTab(tabIds[0]);
        }

        return false;
    }

    public setCookie(cookieObj) {
        return this.client.setCookie(cookieObj);
    }

    public getCookie(cookieName) {
        return this.client.getCookie(cookieName);
    }

    public deleteCookie(cookieName) {
        return this.client.deleteCookie(cookieName);
    }

    public getPlaceHolderValue(xpath) {
        return this.getAttribute(xpath, 'placeholder');
    }

    async switchToFrame(name) {
        return this.client.frame(name);
    }

    public async switchToParentFrame() {
        return this.client.frameParent();
    }

    private async getTextsInternal(
        xpath,
        trim,
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

    public execute(fn, ...args) {
        return this.client.execute(fn, ...args);
    }

    public pause(timeout) {
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

    public async url(val?: string) {
        await this.extensionHandshake();
        return this.client.url(val);
    }

    public keys(value) {
        this.logger.debug(`Send keys ${value}`);

        return this.client.keys(value);
    }

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

    public uploadFile(fullPath) {
        return this.client.uploadFile(fullPath);
    }

    public isStopped(): boolean {
        return this.isSessionStopped;
    }

    public async end() {
        if (this.config.devtool !== null && this.isRegisteredInDevtool) {
            await this.unregisterAppInDevtool();
        }

        this.resetMainTabId();
        await this.client.end();
        this.isSessionStopped = true;
    }

    public async getCssProperty(
        xpath,
        cssProperty: string,
        timeout: number = this.WAIT_TIMEOUT,
    ): Promise<any> {
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);
        return await this.client.getCssProperty(xpath, cssProperty);
    }

    public async getSource() {
        return await this.client.getSource();
    }

    public async isExisting(xpath) {
        xpath = this.normalizeSelector(xpath);
        return await this.client.isExisting(xpath);
    }

    public async waitForValue(
        xpath,
        timeout: number = this.WAIT_TIMEOUT,
        reverse = false,
    ) {
        xpath = this.normalizeSelector(xpath);
        return await this.client.waitForValue(xpath, timeout, reverse);
    }

    public async waitForSelected(
        xpath,
        timeout: number = this.WAIT_TIMEOUT,
        reverse = false,
    ) {
        xpath = this.normalizeSelector(xpath);
        return await this.client.waitForSelected(xpath, timeout, reverse);
    }

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

    public async selectByAttribute(
        xpath,
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
        } catch (e) {
            e.message = errorMessage;
            throw e;
        }
    }

    public async getLocation(xpath, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);
        return await this.client.getLocation(xpath);
    }

    public async getActiveElement() {
        return await this.client.getActiveElement();
    }

    public async setTimeZone(timezone: string) {
        return this.client.setTimeZone(timezone);
    }

    public async getWindowSize() {
        return this.client.getWindowSize();
    }

    public async savePDF(options: SavePdfOptions) {
        if (!options.filepath) {
            throw new Error('Filepath is not defined');
        }
        return this.client.savePDF(options);
    }

    public async addValue(
        xpath,
        value: string | number,
        timeout: number = this.WAIT_TIMEOUT,
    ) {
        await this.waitForExist(xpath, timeout);
        xpath = this.normalizeSelector(xpath);
        return this.client.addValue(xpath, value);
    }

    public async doubleClick(xpath, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);
        xpath = this.normalizeSelector(xpath);
        return this.client.doubleClick(xpath);
    }

    public async waitForClickable(xpath, timeout: number = this.WAIT_TIMEOUT) {
        xpath = this.normalizeSelector(xpath);
        return this.client.waitForClickable(xpath, timeout);
    }

    public async isClickable(xpath, timeout: number = this.WAIT_TIMEOUT) {
        xpath = this.normalizeSelector(xpath);
        return this.client.isClickable(xpath);
    }

    public async waitForEnabled(xpath, timeout: number = this.WAIT_TIMEOUT) {
        xpath = this.normalizeSelector(xpath);
        return this.client.waitForEnabled(xpath, timeout);
    }

    public async waitForStable(xpath, timeout: number = this.WAIT_TIMEOUT) {
        xpath = this.normalizeSelector(xpath);
        return this.client.waitForStable(xpath, timeout);
    }

    public async isFocused(xpath) {
        xpath = this.normalizeSelector(xpath);
        return this.client.isFocused(xpath);
    }

    public async isStable(xpath) {
        xpath = this.normalizeSelector(xpath);
        return this.client.isStable(xpath);
    }
}
