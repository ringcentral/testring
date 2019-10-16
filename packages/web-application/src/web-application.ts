import * as url from 'url';
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
} from '@testring/types';

import { asyncBreakpoints } from '@testring/async-breakpoints';
import { loggerClient, LoggerClient } from '@testring/logger';
import { generateUniqId } from '@testring/utils';
import { PluggableModule } from '@testring/pluggable-module';
import { createElementPath, ElementPath } from '@testring/element-path';

import { createAssertion } from './assert';
import { WebClient } from './web-client';
import * as utils from './utils';

type valueType = string | number | null | undefined;

export class WebApplication extends PluggableModule {
    protected LOGGER_PREFIX: string = '[web-application]';

    protected WAIT_PAGE_LOAD_TIMEOUT: number = 3 * 60000;

    protected WAIT_TIMEOUT: number = 30000;

    protected TICK_TIMEOUT: number = 100;

    protected config: IWebApplicationConfig;

    private screenshotsEnabledManually: boolean = true;

    private isLogOpened: boolean = false;

    private mainTabID: number | null = null;

    private isRegisteredInDevtool: boolean = false;

    private applicationId: string = `webApp-${generateUniqId()}`;

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
        waitForRoot(timeout) {
            return `Waiting for root element for ${timeout}`;
        },
        waitForExist(xpath, timeout: number = this.WAIT_TIMEOUT) {
            return `Waiting ${this.formatXpath(xpath)} for ${timeout}`;
        },
        waitForNotExists(xpath, timeout: number = this.WAIT_TIMEOUT) {
            return `Waiting not exists ${this.formatXpath(xpath)} for ${timeout}`;
        },
        waitForNotVisible(xpath, timeout: number = this.WAIT_TIMEOUT) {
            return `Waiting for not visible ${this.formatXpath(xpath)} for ${timeout}`;
        },
        waitForVisible(xpath, timeout: number = this.WAIT_TIMEOUT) {
            return `Waiting for visible ${this.formatXpath(xpath)} for ${timeout}`;
        },
        openPage(uri: ((arg) => any) | string) {
            if (typeof uri === 'string') {
                return `Opening page uri: ${uri}`;
            } else {
                return 'Opening page';
            }
        },
        isBecomeVisible(xpath, timeout: number = this.WAIT_TIMEOUT) {
            return `Waiting for become visible ${this.formatXpath(xpath)} for ${timeout}`;
        },
        isBecomeHidden(xpath, timeout: number = this.WAIT_TIMEOUT) {
            return `Waiting for become hidden ${this.formatXpath(xpath)} for ${timeout}`;
        },
        click(xpath) {
            return `Click on ${this.formatXpath(xpath)}`;
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
        selectByName(xpath, value: string | number) {
            return `Select by name ${this.formatXpath(xpath)} ${value}`;
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
        setChecked(xpath, checked: boolean = true) {
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
            return `Checking classes ${suitableClasses.join(', ')} is\\are exisists in ${this.formatXpath(xpath)}`;
        },
        moveToObject(xpath, x: number = 1, y: number = 1) {
            return `Move cursor to ${this.formatXpath(xpath)} points (${x}, ${y})`;
        },
        scroll(xpath, x: number = 1, y: number = 1) {
            return `Scroll ${this.formatXpath(xpath)} to (${x}, ${y})`;
        },
        dragAndDrop(xpathSource, xpathDestination) {
            return `dragAndDrop ${this.formatXpath(xpathSource)} to ${this.formatXpath(xpathDestination)}`;
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
            return `Get CSS property ${cssProperty} from ${this.formatXpath(xpath)}`;
        },
        getSource() {
            return 'Get source of current page';
        },
        waitForValue(xpath, timeout: number = this.WAIT_TIMEOUT, reverse: boolean) {
            if (reverse) {
                return `Waiting for element ${this.formatXpath(xpath)} doesn't has value for ${timeout}`;
            } else {
                return `Waiting for any value of ${this.formatXpath(xpath)} for ${timeout}`;
            }
        },
        waitForSelected(xpath, timeout: number = this.WAIT_TIMEOUT, reverse: boolean) {
            if (reverse) {
                return `Waiting for element ${this.formatXpath(xpath)} isn't selected for ${timeout}`;
            } else {
                return `Waiting for element ${this.formatXpath(xpath)} is selected for ${timeout}`;
            }
        },
        waitUntil(condition, timeout: number = this.WAIT_TIMEOUT, timeoutMsg?: string, interval?: number) {
            return `Waiting by condition for ${timeout}`;
        },
        selectByAttribute(xpath, attribute: string, value: string) {
            return `Select by attribute ${attribute} with value ${value} from ${xpath}`;
        },
    };

    constructor(
        private testUID: string,
        protected transport: ITransport,
        config: Partial<IWebApplicationConfig> = {},
    ) {
        super();
        this.config = this.getConfig(config);
        this.decorateMethods();
    }

    protected getConfig(userConfig: Partial<IWebApplicationConfig>): IWebApplicationConfig {
        return Object.assign({}, {
            screenshotsEnabled: false,
            devtool: null,
        }, userConfig);
    }

    protected decorateMethods() {
        const decorators = (this.constructor as any).stepLogMessagesDecorator;

        // Reset isLogOpened on init, and bypass tslint
        if (this.isLogOpened) {
            this.isLogOpened = false;
        }

        for (let key in decorators) {
            ((key) => {
                if (decorators.hasOwnProperty(key)) {
                    const originMethod = this[key];
                    const logFn = decorators[key];

                    // eslint-disable-next-line func-style
                    const method = async function decoratedMethod(...args) {
                        const logger = this.logger;
                        const message = logFn.apply(this, args);
                        let result;

                        if (this.isLogOpened) {
                            logger.debug(message);
                            result = originMethod.apply(this, args);
                        } else {
                            await asyncBreakpoints.waitBeforeInstructionBreakpoint((state) => {
                                if (state) {
                                    logger.debug('Debug: Stopped in breakpoint before instruction execution');
                                }
                            });
                            logger.startStep(message);
                            this.isLogOpened = true;

                            try {
                                result = originMethod.apply(this, args);
                                if (result && result.catch && typeof result.catch === 'function') {
                                    result = result.catch(async (err) => {
                                        await this.asyncErrorHandler(err);
                                        logger.endStep(message);
                                        this.isLogOpened = false;
                                        return Promise.reject(err);
                                    }).then((result) => {
                                        logger.endStep(message);
                                        this.isLogOpened = false;
                                        return result;
                                    });
                                } else {
                                    logger.endStep(message);
                                    this.isLogOpened = false;
                                }
                            } catch (err) {
                                this.errorHandler(err);
                                logger.endStep(message);
                                this.isLogOpened = false;

                                throw err;
                            }

                            await asyncBreakpoints.waitAfterInstructionBreakpoint((state) => {
                                if (state) {
                                    logger.debug('Debug: Stopped in breakpoint after instruction execution');
                                }
                            });
                        }

                        return result;
                    };

                    Object.defineProperty(method,'originFunction', {
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
        const { successMessage, assertMessage } = meta;
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
        const { successMessage, assertMessage } = meta;
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
        return utils.logXpath(xpath);
    }

    protected getRootSelector(): ElementPath {
        return this.root;
    }

    protected normalizeSelector(selector: string | ElementPath, allowMultipleNodesInResult = false): string {
        if (!selector) {
            return this.getRootSelector().toString();
        }

        return (selector as ElementPath).toString(allowMultipleNodesInResult);
    }

    protected async asyncErrorHandler(error) {
        await this.makeScreenshot();
    }

    protected errorHandler(error) {
        this.logger.error(error);
    }

    protected async devtoolHighlight(xpath: string | ElementPath | null, multiple: boolean = false): Promise<void> {
        const normalizedXPath = (xpath !== null) ? this.normalizeSelector(xpath, multiple) : null;

        if (this.config.devtool) {
            try {
                await this.client.execute((addHighlightXpath) => {
                    window.postMessage({
                        type: ExtensionPostMessageTypes.CLEAR_HIGHLIGHTS,
                    }, '*');

                    if (addHighlightXpath) {
                        window.postMessage({
                            type: ExtensionPostMessageTypes.ADD_XPATH_HIGHLIGHT,
                            xpath: addHighlightXpath,
                        }, '*');
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

    public async waitForExist(xpath, timeout: number = this.WAIT_TIMEOUT, skipMoveToObject: boolean = false) {
        await this.devtoolHighlight(xpath);

        const normalizedXPath = this.normalizeSelector(xpath);
        const exists = await this.client.waitForExist(
            normalizedXPath,
            timeout
        );

        if (!skipMoveToObject) {
            try {
                await this.client.moveToObject(normalizedXPath, 1, 1);
            } catch (ignore) { /* ignore */ }
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
        } catch (ignore) { /* ignore */ }

        if (exists) {
            throw new Error(`Wait for not exists failed, element ${this.formatXpath(xpath)} is exists`);
        }

        return !exists;
    }

    public async waitForVisible(xpath, timeout: number = this.WAIT_TIMEOUT, skipMoveToObject: boolean = false) {
        const startTime = Date.now();

        await this.waitForExist(xpath, timeout, skipMoveToObject);

        const spentTime = Date.now() - startTime;
        const waitTime = timeout - spentTime;

        if (waitTime <= 0) {
            throw new Error(`Wait for visible failed, element not exists after ${timeout}ms`);
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
            throw new Error('Wait for not visible is failed, root element is still pending');
        }

        while (expires - Date.now() >= 0) {
            let visible = await this.client.isVisible(xpath);

            if (!visible) {
                return false;
            }

            await this.pause(this.TICK_TIMEOUT);
        }

        throw new Error('Wait for not visible failed, element ' + path + ' is visible');
    }

    public async getTitle() {
        return this.client.getTitle();
    }

    public async logNavigatorVersion() {
        const userAgent = await this.execute(() => window.navigator && window.navigator.userAgent);
        this.logger.debug(userAgent);
        return userAgent;
    }

    private documentReadyWait() {
        const attemptCount = 1000;
        const attemptInterval = 200;

        return new Promise(async (resolve, reject) => {
            let i = 0;
            let result = false;
            while (i < attemptCount) {
                const ready = await this.execute(() => document.readyState === 'complete');

                if (ready) {
                    result = true;
                    break;
                } else {
                    await this.pause(attemptInterval);
                    i++;
                }
            }

            result ? resolve() : reject();
        });
    }

    private async openPageFromURI(uri) {
        const prevUrl: any = await this.url();

        if (url.parse(prevUrl).path === url.parse(uri).path) {
            await this.url(uri);
            await this.refresh();
            await this.logNavigatorVersion();
            return this.documentReadyWait();
        } else {
            await this.url(uri);
            await this.logNavigatorVersion();
            return this.documentReadyWait();
        }
    }

    public async openPage(
        page: ((arg: this) => any) | string,
        timeout: number = this.WAIT_PAGE_LOAD_TIMEOUT
    ): Promise<any> {
        if (typeof page === 'string') {
            let timer;

            let result = await Promise.race([
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

        } else if (typeof page === 'function') {
            return page(this);
        } else {
            throw new Error('Unsupported path type for openPage');
        }
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

        return this.client.click(normalizedSelector);
    }

    public async getValue(xpath, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);
        return this.client.getValue(xpath);
    }

    public async simulateJSFieldClear(xpath) {
        return this.simulateJSFieldChange(xpath, '');
    }

    public async simulateJSFieldChange(xpath, value) {
        const result = await this.client.executeAsync((xpath, value, done) => {

            function getElementByXPath(xpath) {
                // eslint-disable-next-line no-var
                var element = document.evaluate(xpath, document, null,
                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                if (element.snapshotLength > 0) {
                    return element.snapshotItem(0) as any;
                }

                return null;
            }

            try {
                const element = getElementByXPath(xpath);

                if (element) {
                    element.value = value;
                    const eventInit = {
                        bubbles: true,
                    };
                    const inputEvent = new Event('input', eventInit);
                    const keydownEvent = new Event('keydown', eventInit);
                    const keyupEvent = new Event('keyup', eventInit);

                    element.dispatchEvent(keydownEvent);
                    element.dispatchEvent(inputEvent);
                    element.dispatchEvent(keyupEvent);
                    done(null);
                } else {
                    done(`Element not found ${xpath}`);
                }
            } catch (e) {
                done(`${e.message} ${xpath}`);
            }
        }, xpath, value);

        if (result) {
            throw new Error(result);
        }
    }

    public async clearElement(xpath, emulateViaJs: boolean = false, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);

        if (emulateViaJs) {
            return this.simulateJSFieldClear(xpath);
        } else {
            await this.client.setValue(xpath,' ');
            await this.waitForExist(xpath, timeout);
            return this.client.keysOnElement(xpath, ['Backspace']);
        }
    }

    public async setValue(xpath, value: valueType, emulateViaJS: boolean = false, timeout: number = this.WAIT_TIMEOUT) {
        if (value === '' || value === null || value === undefined) {
            await this.clearElement(xpath, emulateViaJS, timeout);
        } else {
            await this.waitForExist(xpath, timeout);
            xpath = this.normalizeSelector(xpath);

            if (emulateViaJS) {
                this.simulateJSFieldChange(xpath, value);

                this.logger.debug(`Value ${value} was entered into ${this.formatXpath(xpath)} using JS emulation`);
            } else {
                await this.client.setValue(xpath, value);
                this.logger.debug(`Value ${value} was entered into ${this.formatXpath(xpath)} using Selenium`);
            }
        }

        await this.makeScreenshot();
    }

    public async getText(xpath, trim: boolean = true, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);

        const text = (await this.getTextsInternal(xpath, trim)).join(' ');

        this.logger.debug(`Get text from ${this.formatXpath(xpath)} returns "${text}"`);

        return text;
    }

    public async getTextWithoutFocus(xpath, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout, true);

        let text = (await this.getTextsInternal(xpath, true)).join(' ');

        this.logger.debug(`Get tooltip text from ${this.formatXpath(xpath)} returns "${text}"`);
        return text;
    }

    public async getTexts(xpath, trim = true, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);

        let texts = await this.getTextsInternal(xpath, trim, true);

        this.logger.debug(`Get texts from ${this.formatXpath(xpath)} returns "${texts.join('\n')}"`);
        return texts;
    }

    public async getOptionsProperty(xpath, prop: string, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);

        return this.client.executeAsync(function (xpath, prop, done) {
            function getElementByXPath(xpath) {

                const element = document.evaluate(
                    xpath,
                    document,
                    null,
                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
                );

                if (element.snapshotLength > 0) {
                    return element.snapshotItem(0) as any;
                }

                return null;
            }

            try {
                const element = getElementByXPath(xpath);

                if (element && element.tagName.toLowerCase() === 'select') {
                    const texts: Array<any> = [];

                    for (let i = 0, len = element.options.length; i < len; i++) {
                        texts.push(element.options[i][prop]);
                    }

                    done(texts);
                } else {
                    throw Error('Element not found');
                }
            } catch (e) {
                throw Error(`${e.message} ${xpath}`);
            }
        }, xpath, prop);
    }

    public async getSelectTexts(xpath, trim: boolean = true, timeout: number = this.WAIT_TIMEOUT) {
        const texts: string[] = await this.getOptionsProperty(xpath, 'text', timeout);

        if (!texts) {
            return [];
        }

        if (trim) {
            return texts.map(item => item.trim());
        }

        return texts;
    }

    public async getSelectValues(xpath, timeout: number = this.WAIT_TIMEOUT) {
        return (await this.getOptionsProperty(xpath, 'value', timeout)) || [];
    }

    public async selectNotCurrent(xpath, timeout: number = this.WAIT_TIMEOUT) {
        let options: any[] = await this.getSelectValues(xpath, timeout);
        let value: any = await this.client.getValue(this.normalizeSelector(xpath));
        let index = options.indexOf(value);
        if (index > -1) {
            options.splice(index, 1);
        }
        await this.selectByValue(xpath, options[0]);
    }

    public async selectByIndex(xpath, value: string | number, timeout: number = this.WAIT_TIMEOUT) {
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

    public async selectByName(xpath, value: string | number, timeout: number = this.WAIT_TIMEOUT) {
        const logXpath = this.formatXpath(xpath);
        const errorMessage = `Could not select by name "${value}": ${logXpath}`;

        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath, timeout);

        try {
            await this.client.selectByName(xpath, value);
        } catch (error) {
            error.message = errorMessage;
            throw error;
        }
    }

    public async selectByValue(xpath, value: string | number, timeout: number = this.WAIT_TIMEOUT) {
        const errorMessage = `Could not select by value "${value}": ${this.formatXpath(xpath)}`;

        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath, timeout);

        try {
            return await this.client.selectByValue(xpath, value);
        } catch (error) {
            error.message = errorMessage;
            throw error;
        }
    }

    public async selectByVisibleText(xpath, value: string | number, timeout: number = this.WAIT_TIMEOUT) {
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

        let value = await this.client.getValue(xpath);

        if (typeof value === 'string' || typeof value === 'number') {
            // TODO rework this for supporting custom selectors
            xpath += `//option[@value='${value}']`;

            try {
                let options = await this.client.getText(xpath);
                if (options instanceof Array) {
                    return options[0] || '';
                }
                return options || '';
            } catch (ignore) { /* ignore */ }
        }
        return '';
    }

    public async getElementsIds(xpath, timeout: number = this.WAIT_TIMEOUT) {
        // todo (flops) need to add log ?
        await this.waitForExist(xpath, timeout);
        let elements: any = await this.elements(xpath);
        let elementIds: any[] = [];

        for (let i = 0; i < elements.length; i++) {
            let elem: any = elements[i];
            elementIds.push(elem.ELEMENT);
        }

        return (elementIds.length > 1) ? elementIds : elementIds[0];
    }

    public async isElementSelected(elementId) {
        // todo (flops) need to add log ?
        let elementSelected: any = await this.client.elementIdSelected(elementId.toString());

        return !!elementSelected;
    }

    public async isChecked(xpath, timeout: number = this.WAIT_TIMEOUT) {
        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath, timeout);

        const isSelected = await this.client.isSelected(xpath);

        return !!isSelected;
    }

    public async setChecked(xpath, checked: boolean = true, timeout: number = this.WAIT_TIMEOUT) {
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
        const elemClassesArr = elemClasses.trim().toLowerCase().split(/\s+/g);

        return suitableClasses.some((suitableClass) => elemClassesArr.includes(suitableClass.toLowerCase()));
    }

    public async getAttribute(xpath, attr: string, timeout: number = this.WAIT_TIMEOUT) {
        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath, timeout);

        return this.client.getAttribute(xpath, attr);
    }

    public async isReadOnly(xpath, timeout: number = this.WAIT_TIMEOUT) {
        const inputTags = [
            'input',
            'select',
            'textarea',
        ];

        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath, timeout);

        const readonly: string = await this.client.getAttribute(xpath, 'readonly');
        const str: string = await this.client.getTagName(xpath);

        if (
            readonly === 'true' ||
            readonly === 'readonly' ||
            readonly === 'readOnly' ||
            inputTags.indexOf(str) === -1
        ) {
            return true;
        }

        const disabled: string = await this.client.getAttribute(xpath, 'disabled');

        return (
            disabled === 'true' ||
            disabled === 'disabled'
        );
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

    public async moveToObject(xpath, x: number = 1, y: number = 1, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);

        return this.client.moveToObject(xpath, x, y);
    }

    public async scroll(xpath, x: number = 1, y: number = 1, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);

        return this.client.scroll(xpath, x, y);
    }

    public async dragAndDrop(xpathSource, xpathDestination, timeout: number = this.WAIT_TIMEOUT) {
        // TODO This method doesn't work successfully, ReImplement
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

        return (elementsCount === 0);
    }

    public async isElementsExist(xpath, timeout: number = this.WAIT_TIMEOUT) {
        const elementsCount = await this.getElementsCount(
            this.normalizeSelector(xpath),
            timeout,
        );

        return (elementsCount > 0);
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
        return this.client.close(focusToTabId || mainTabID);
    }

    public async closeCurrentTab(focusToTabId = null) {
        await this.client.window(null);
        const mainTabID = await this.getMainTabId();
        await this.setActiveTab(focusToTabId || mainTabID);
    }

    public async windowHandles() {
        return this.client.windowHandles();
    }

    public async window(handle) {
        await this.initMainTabId();
        return this.client.window(handle);
    }

    public async newWindow(url: string, windowName: string, windowFeatures: WindowFeaturesConfig) {
        return this.client.newWindow(url, windowName, windowFeatures);
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

        return this.client.getHTML(xpath, true);
    }

    public async getCurrentTabId() {
        return this.client.getCurrentTabId();
    }

    public async switchTab(tabId) {
        await this.initMainTabId();
        return this.client.switchTab(tabId);
    }

    public async closeAllOtherTabs() {
        let tabIds: any = await this.getTabIds();

        while (tabIds.length > 1) {
            await this.closeFirstSiblingTab();

            tabIds = await this.getTabIds();
        }
    }

    public async setActiveTab(tabId: number | null) {
        await this.switchTab(tabId);
        await this.window(tabId);
    }

    public async closeFirstSiblingTab() {
        await this.switchToFirstSiblingTab();
        await this.closeBrowserWindow();
    }

    public async switchToFirstSiblingTab() {
        const mainTabID = await this.getMainTabId();
        const tabIds: Array<number> = await this.getTabIds();
        const siblingTabs = tabIds.filter(tabId => tabId !== mainTabID);

        if (siblingTabs.length === 0) {
            return false;
        }

        await this.setActiveTab(siblingTabs[0]);
        return true;
    }

    public async switchToMainSiblingTab() {
        const mainTabID = await this.getMainTabId();
        let tabIds: any = await this.getTabIds();
        tabIds = tabIds.filter(tabId => tabId === mainTabID);

        if (tabIds[0]) {
            await this.setActiveTab(tabIds[0]);
            return true;
        }
        return false;
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

    private async getTextsInternal(xpath, trim, allowMultipleNodesInResult = false) {
        await this.devtoolHighlight(xpath, allowMultipleNodesInResult);

        const normalizedXpath = this.normalizeSelector(xpath, allowMultipleNodesInResult);

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

        return new Promise(resolve => setTimeout(resolve, timeout));
    }

    private async registerAppInDevtool(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const removeListener = this.transport.on(
                WebApplicationDevtoolActions.registerComplete,
                (message: IWebApplicationRegisterCompleteMessage) => {
                    if (message.id === this.applicationId) {
                        if (message.error === null || message.error === undefined) {
                            resolve();
                        } else {
                            reject(message.error);
                        }
                        removeListener();
                    }
                });

            const payload: IWebApplicationRegisterMessage = {
                id: this.applicationId,
            };

            this.transport.broadcastUniversally(WebApplicationDevtoolActions.register, payload);
        });
    }

    private async unregisterAppInDevtool(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const removeListener = this.transport.on<IWebApplicationRegisterCompleteMessage>(
                WebApplicationDevtoolActions.unregisterComplete,
                (message) => {
                    if (message.id === this.applicationId) {
                        if (message.error === null || message.error === undefined) {
                            resolve();
                        } else {
                            reject(message.error);
                        }
                        removeListener();
                    }
                });

            const payload: IWebApplicationRegisterMessage = {
                id: this.applicationId,
            };

            this.transport.broadcastUniversally(WebApplicationDevtoolActions.unregister, payload);
        });
    }

    private async extensionHandshake() {
        if (this.config.devtool !== null && !this.isRegisteredInDevtool) {
            const id = this.applicationId;

            this.logger.debug(`WebApplication ${id} devtool initial registration`);
            await this.registerAppInDevtool();

            const {
                extensionId,
                httpPort,
                wsPort,
                host,
            } = this.config.devtool;
            const url = `chrome-extension://${extensionId}/options.html?httpPort=${httpPort}&host=${host}&wsPort=${wsPort}&appId=${id}&page=handshake`;

            await this.client.url(url);

            await this.client.executeAsync(function (done: WebApplicationDevtoolCallback) {
                (window as any).resolveWebApp = done;
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
        this.logger.debug('Screenshots were disabled. DO NOT FORGET to turn them on back!');
        this.screenshotsEnabledManually = false;
    }

    public async enableScreenshots() {
        this.logger.debug('Screenshots were enabled');
        this.screenshotsEnabledManually = true;
    }

    public async makeScreenshot(force: boolean = false) {
        if (this.config.screenshotsEnabled && (this.screenshotsEnabledManually || force)) {
            const screenshoot = await this.client.makeScreenshot();
            const screenDate = new Date();
            const formattedDate = (`${screenDate.toLocaleTimeString()} ${screenDate.toDateString()}`)
                .replace(/\s+/g, '_');

            this.logger.media(
                `${this.testUID}-${formattedDate}-${generateUniqId(5)}.png`,
                screenshoot
            );
        }
    }

    public uploadFile(fullPath) {
        return this.client.uploadFile(fullPath);
    }

    public async end() {
        if (this.config.devtool !== null && this.isRegisteredInDevtool) {
            await this.unregisterAppInDevtool();
        }
        await this.client.end();
    }

    public async getCssProperty(xpath, cssProperty: string, timeout: number = this.WAIT_TIMEOUT): Promise<any> {
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

    public async waitForValue(xpath, timeout: number = this.WAIT_TIMEOUT, reverse: boolean = false) {
        xpath = this.normalizeSelector(xpath);
        return await this.client.waitForValue(xpath, timeout, reverse);
    }

    public async waitForSelected(xpath, timeout: number = this.WAIT_TIMEOUT, reverse: boolean = false) {
        xpath = this.normalizeSelector(xpath);
        return await this.client.waitForSelected(xpath, timeout, reverse);
    }

    public async waitUntil(
        condition: () => boolean | Promise<boolean>,
        timeout: number = this.WAIT_TIMEOUT,
        timeoutMsg: string = 'Wait by condition failed!',
        interval: number = 500
    ) {
        return await this.client.waitUntil(condition, timeout, timeoutMsg, interval);
    }

    public async selectByAttribute(xpath, attribute: string, value: string, timeout: number = this.WAIT_TIMEOUT) {
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
}
