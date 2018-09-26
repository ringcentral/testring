/* eslint-disable */

import * as url from 'url';
import { ITransport } from '@testring/types';
import { LoggerClient } from '@testring/logger';
import { PluggableModule } from '@testring/pluggable-module';
import { createElementPath, ElementPath } from '@testring/element-path';
import { createAssertion } from './assert';
import { WebClient } from './web-client';
import * as utils from './utils';

const nanoid = require('nanoid');

type valueType = string | number | null | undefined;

export class WebApplication extends PluggableModule {
    protected _logger: LoggerClient | null = null;

    protected _client: WebClient | null = null;

    protected WAIT_TIMEOUT: number = 30000;

    protected TICK_TIMEOUT: number = 100;

    private screenshotsEnabled: boolean = true;

    private isLogOpened: boolean = false;

    private mainTabID: number | null = null;

    public assert = createAssertion(false, this);

    public softAssert = createAssertion(true, this);

    public root = createElementPath();

    static stepLogMessagesDecorator = {
        waitForRoot(timeout) {
            return `Waiting for root element for ${timeout}`;
        },
        waitForExist(xpath, timeout: number = this.WAIT_TIMEOUT) {
            return `Waiting ${this.formatXpath(xpath)} for ${timeout}`
        },
        waitForNotExists(xpath, timeout: number = this.WAIT_TIMEOUT) {
            return `Waiting not exists ${this.formatXpath(xpath)} for ${timeout}`;
        },
        waitForNotVisible(xpath, timeout: number = this.WAIT_TIMEOUT) {
            return `Waiting for not visible ${this.formatXpath(xpath)} for ${timeout}`
        },
        waitForVisible(xpath, timeout: number = this.WAIT_TIMEOUT) {
            return `Waiting for visible ${this.formatXpath(xpath)} for ${timeout}`;
        },
        openPage(uri: ((arg) => any) | string) {
            if (typeof uri === 'string') {
                return `Opening page uri: ${uri}`;
            } else {
                return `Opening page`;
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
            return `Select by value ${this.formatXpath(xpath)} ${value}`
        },
        selectByVisibleText(xpath, value: string | number) {
            return `Select by visible text ${this.formatXpath(xpath)} ${value}`;
        },
        getSelectedText(xpath) {
            return `Get selected text ${this.formatXpath(xpath)}`;
        },
        isChecked(xpath) {
            return `Is checked/selected ${this.formatXpath(xpath)}`;
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
            return `dragAndDrop ${this.formatXpath(xpathSource)} to ${this.formatXpath(xpathDestination)}`
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
    };

    constructor(
        private testUID: string,
        protected transport: ITransport,
        protected config: any = {
            screenshotsEnabled: false,
        },
    ) {
        super();
        this.decorateMethods();
    }

    protected decorateMethods() {
        const logger = this.logger;
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
                    const method = function decoratedMethod(...args) {
                        const message = logFn.apply(this, args);
                        let result;

                        if (this.isLogOpened) {
                            logger.debug(message);
                            result = originMethod.apply(this, args);
                        } else {
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

    public get client(): WebClient {
        if (this._client) {
            return this._client;
        }

        const applicationID = `${this.testUID}-${nanoid()}`;
        this._client = new WebClient(applicationID, this.transport);

        return this._client;
    }

    public get logger(): LoggerClient {
        if (this._logger) {
            return this._logger;
        }

        this._logger = new LoggerClient(this.transport, '[web-application]');

        return this._logger;
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

    public getSoftAssertionErrors() {
        return [...this.softAssert._errorMessages];
    }

    public async waitForExist(xpath, timeout: number = this.WAIT_TIMEOUT, skipMoveToObject: boolean = false) {
        const normalizedXPath = this.normalizeSelector(xpath);
        const exists = await this.client.waitForExist(
            normalizedXPath,
            timeout
        );

        if (!skipMoveToObject) {
            try {
                await this.client.moveToObject(normalizedXPath, 1, 1);
            } catch {
            }
        }

        return exists;
    }

    public async waitForRoot(timeout: number = this.WAIT_TIMEOUT) {
        return this.client.waitForExist(this.getRootSelector().toString(), timeout);
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
        } catch {
        }

        if (exists) {
            throw new Error(`Wait for not exists failed, element ${utils.logXpath(xpath)} is exists`);
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
        const path = utils.logXpath(xpath);
        const expires = Date.now() + timeout;

        xpath = this.normalizeSelector(xpath);

        try {
            await this.waitForRoot(timeout);
        } catch (error) {
            throw new Error('Wait for not visible is failed, root element is still pending');
        }

        while (true) {
            let visible = await this.client.isVisible(xpath);

            if (!visible) {
                return false;
            }

            if (expires - Date.now() <= 0) {
                throw new Error('Wait for not visible failed, element ' + path + ' is visible');
            }

            await this.pause(this.TICK_TIMEOUT);
        }
    }

    public async getTitle() {
        return this.client.getTitle();
    }

    public async logNavigatorVersion() {
        const userAgent = await this.execute(() => window.navigator && window.navigator.userAgent);

        this.logger.debug(userAgent);
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

    public async openPage(uri: ((arg: this) => any) | string): Promise<any> {
        if (typeof uri === 'string') {
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
        } else if (typeof uri === 'function') {
            return uri(this);
        } else {
            throw new Error('Unsupported path type for openPage');
        }
    }

    public async isBecomeVisible(xpath, timeout: number = this.WAIT_TIMEOUT) {
        xpath = this.normalizeSelector(xpath);

        try {
            await this.client.waitForVisible(xpath, timeout);
            return true;
        } catch {
            return false;
        }
    }

    public async isBecomeHidden(xpath, timeout: number = this.WAIT_TIMEOUT) {
        const expires = Date.now() + timeout;
        xpath = this.normalizeSelector(xpath);

        while (true) {
            const visible = await this.client.isVisible(xpath);

            if (!visible) {
                return true;
            }

            if (expires - Date.now() <= 0) {
                return false;
            }

            await this.pause(this.TICK_TIMEOUT);
        }
    }

    public async waitElementByLocator(xpath, timeout: number = this.WAIT_TIMEOUT) {
        // TODO (flops) delete?
        const waitUntil = Date.now() + timeout;

        xpath = this.normalizeSelector(xpath);

        let isElementVisible = false;

        while (!isElementVisible && Date.now() < waitUntil) {
            isElementVisible = await this.client.isVisible(xpath);

            await this.pause(this.TICK_TIMEOUT);
        }

        return isElementVisible;
    }

    public async click(xpath, timeout: number = this.WAIT_TIMEOUT) {
        const normalizedSelector = this.normalizeSelector(xpath);

        await this.waitForExist(normalizedSelector, timeout);
        await this.makeScreenshot();

        return this.client.click(normalizedSelector);
    }

    public async clickHiddenElement(xpath, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);
        xpath = this.normalizeSelector(xpath);

        let result = await this.client.executeAsync(function(xpath, done) {

            function getElementByXPath(xpath) {
                var element = document.evaluate(xpath, document, null,
                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                if (element.snapshotLength > 0) {
                    return element.snapshotItem(0) as any;
                }
                return null;
            }

            try {
                let element = getElementByXPath(xpath);
                if (element) {
                    element.className = element.className.replace(/invisible/gi, '');
                    element.focus();
                    element.click();
                    done(null);
                } else {
                    done(`Element not found ${xpath}`);
                }
            } catch (e) {
                done(`${e.message} ${xpath}`);
            }
        }, xpath);

        if (result) {
            throw new Error(result);
        } else {
            this.logger.debug(`Element ${utils.logXpath(xpath)} was made visible and clicked`);
        }

        await this.makeScreenshot();
    }

    public async getValue(xpath, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);
        return this.client.getValue(xpath);
    }

    public async setValue(xpath, value: valueType, emulateViaJS: boolean = false, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);
        xpath = this.normalizeSelector(xpath);

        if (emulateViaJS) {
            let result = await this.client.executeAsync((xpath, value, done) => {

                function getElementByXPath(xpath) {
                    var element = document.evaluate(xpath, document, null,
                        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    if (element.snapshotLength > 0) {
                        return element.snapshotItem(0) as any;
                    }

                    return null;
                }

                try {
                    let element = getElementByXPath(xpath);
                    let evt = document.createEvent('HTMLEvents');

                    if (element) {
                        element.focus();
                        element.value = value;

                        evt.initEvent('input', true, true);
                        element.dispatchEvent(evt);
                        element.blur();
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
            } else {
                this.logger.debug(`Value ${value} was entered into ${utils.logXpath(xpath)} using JS emulation`);
            }
        } else {
            if (value === '' || value === null || value === undefined) {
                await this.client.setValue(xpath, ' ');
                await this.client.keys(['Delete', 'Back space']);
            } else {
                await this.client.setValue(xpath, value);
            }

            this.logger.debug(`Value ${value} was entered into ${utils.logXpath(xpath)} using Selenium`);
        }

        await this.makeScreenshot();
    }

    public async getText(xpath, trim: boolean = true, timeout: number = this.WAIT_TIMEOUT) {
        const logXpath = utils.logXpath(xpath);

        await this.waitForExist(xpath, timeout);

        const text = (await this.getTextsInternal(xpath, trim)).join(' ');

        this.logger.debug(`Get text from ${logXpath} returns "${text}"`);

        return text;
    }

    public async getTooltipText(xpath, timeout: number = this.WAIT_TIMEOUT) {
        // TODO (flops) delete the same as getText
        let logXpath = utils.logXpath(xpath);

        await this.waitForExist(xpath, timeout, true);

        let text = (await this.getTextsInternal(xpath, true)).join(' ');

        this.logger.debug(`Get tooltip text from ${logXpath} returns "${text}"`);
        return text;
    }

    public async getTexts(xpath, trim = true, timeout: number = this.WAIT_TIMEOUT) {
        let logXpath = utils.logXpath(xpath);

        await this.waitForExist(xpath, timeout);

        let texts = await this.getTextsInternal(xpath, trim, true);

        this.logger.debug(`Get texts from ${logXpath} returns "${texts.join('\n')}"`);
        return texts;
    }

    public async getOptionsProperty(xpath, prop: string, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);

        return this.client.executeAsync(function(xpath, prop, done) {
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
                    throw Error(`Element not found`);
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
        const logXpath = utils.logXpath(xpath);
        const errorMessage = `Could not select by value "${value}": ${logXpath}`;

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
            // TODO refactor this for supporting custom selectors
            xpath += `//option[@value='${value}']`;
            try {
                let options = await this.client.getText(xpath);
                if (options instanceof Array) {
                    return options[0] || '';
                }
                return options || '';
            } catch (ignore) {
            }
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

    public async isSelected(xpath, timeout: number = this.WAIT_TIMEOUT) {
        // TODO (flops) deprecated
        return this.isChecked(xpath, timeout);
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

    public async rootlessIsVisible(xpath) {
        // TODO (flops) deprecated, when isVisible waitForExist will be resolved, remove it as duplicate
        xpath = this.normalizeSelector(xpath);

        return this.client.isVisible(xpath);
    }

    public async rootlessWaitForVisible(xpath, timeout: number = this.WAIT_TIMEOUT) {
        // TODO (flops) check maybe simplify waitForVisible
        xpath = this.normalizeSelector(xpath);

        return this.client.waitForVisible(xpath, timeout);
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
            'textarea'
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

    public async isDisabled(xpath, timeout: number = this.WAIT_TIMEOUT) {
        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath, timeout);

        // TODO (flops) rewrite check to hasAttribute
        const disabled = await this.client.getAttribute(xpath, 'disabled');

        return (
            disabled === true ||
            disabled === 'true' ||
            disabled === 'disabled'
        );
    }

    public async isEnabled(xpath, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);
        return this.client.isEnabled(xpath);
    }

    public async isCSSClassExists(xpath, ...suitableClasses) {
        // TODO (flops) make suitableClasses as array and add timeout as third argument
        const elemClasses: any = await this.getAttribute(xpath, 'class');
        const elemClassesArr = elemClasses.trim().toLowerCase().split(/\s+/g);

        return suitableClasses.some((suitableClass) => elemClassesArr.includes(suitableClass.toLowerCase()));
    }

    public async maximizeWindow() {
        // TODO (flops) add log
        try {
            await this.client.windowHandleMaximize();
            return true;
        } catch (e) {
            this.logger.error(`failed to maxmize window, ${e}`);
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

    public elements(xpath) {
        return this.client.elements(this.normalizeSelector(xpath, true));
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
        xpath = this.normalizeSelector(xpath, allowMultipleNodesInResult);

        const elements: any = await this.client.elements(xpath);
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

    public url(val?: string) {
        return this.client.url(val);
    }

    public async clearElement(xpath, timeout: number = this.WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);
        return this.client.clearElement(xpath);
    }

    public keys(value) {
        this.logger.debug(`Send keys ${value}`);

        return this.client.keys(value);
    }

    public refresh() {
        return this.client.refresh();
    }

    public getTextsAsArray(xpath, trim = true, timeout = this.WAIT_TIMEOUT) {
        // TODO (flops) deprecated
        return this.getTexts(xpath, trim, timeout);
    }

    public async disableScreenshots() {
        this.logger.debug("Screenshots were disabled. DO NOT FORGET to turn them on back!");
        this.screenshotsEnabled = false;
    }

    public async enableScreenshots() {
        this.logger.debug("Screenshots were enabled");
        this.screenshotsEnabled = true;
    }

    public async makeScreenshot(force: boolean = false) {
        if (this.config.screenshotsEnabled && (this.screenshotsEnabled || force)) {
            const screenshoot = await this.client.makeScreenshot();
            const screenDate = new Date();
            const formattedDate = (`${screenDate.toLocaleTimeString()} ${screenDate.toDateString()}`).replace(/\s+/g, '_');

            this.logger.media(
                `${this.testUID}-${formattedDate}-${nanoid(5)}.png`,
                screenshoot
            );
        }
    }

    public uploadFile(fullPath) {
        return this.client.uploadFile(fullPath);
    }

    public async end() {
        await this.client.end();
    }
}
