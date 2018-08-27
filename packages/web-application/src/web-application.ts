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

const WAIT_TIMEOUT = 30000;
const TICK_TIMEOUT = 100;

export class WebApplication extends PluggableModule {
    protected _logger: LoggerClient | null = null;

    protected _client: WebClient | null = null;

    private mainTabID = 1;

    public assert = createAssertion(false);

    public softAssert = createAssertion(true);

    public root = createElementPath();

    constructor(private testUID: string, protected transport: ITransport) {
        super();
    }

    protected formatXpath(xpath) {
        return utils.logXpath(xpath);
    }


    protected normalizeSelector(selector: string | ElementPath): string {
        if (!selector) {
            return 'body';
        }

        return selector.toString();
    }

    public get client(): WebClient {
        // TODO (@flops) lazy decorator?
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

        this._logger = new LoggerClient(
            this.transport,
            '[web-application]',
        );

        return this._logger;
    }

    public async waitForExist(xpath, timeout: number = WAIT_TIMEOUT, skipMoveToObject = false) {
        this.logger.debug(`Waiting ${xpath} for ${timeout}`);

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

    public async waitForNotExists(xpath, timeout = WAIT_TIMEOUT) {
        let exists = false;

        try {
            xpath = this.normalizeSelector(xpath);
            this.logger.debug(`Waiting not exists ${xpath} for ${timeout}`);
            await this.client.waitForExist(xpath, Number(timeout) || WAIT_TIMEOUT);
            exists = true;
        } catch {
        }

        if (exists) {
            throw new Error(`Wait for not exists failed, element ${utils.logXpath(xpath)} is exists`);
        }
    }

    public async waitForNotVisible(xpath, timeout = WAIT_TIMEOUT) {
        const path = utils.logXpath(xpath);
        const expires = Date.now() + timeout;

        xpath = this.normalizeSelector(xpath);

        this.logger.debug(`Waiting for not visible ${path} for ${timeout}`);

        try {
            await this.client.waitForExist(xpath, timeout);
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

            await this.pause(TICK_TIMEOUT);
        }
    }

    public async waitForVisible(xpath, timeout = WAIT_TIMEOUT, skipMoveToObject = false) {
        const startTime = Date.now();

        await this.waitForExist(xpath, timeout, skipMoveToObject);

        const spentTime = Date.now() - startTime;
        const waitTime = timeout - spentTime;

        if (waitTime <= 0) {
            throw new Error(`Wait for visible failed, element not exists after ${timeout}ms`);
        }

        xpath = this.normalizeSelector(xpath);

        this.logger.debug(`Waiting for visible ${utils.logXpath(xpath)} for ${waitTime}`);

        return this.client.waitForVisible(xpath, waitTime);
    }

    public async openPage(uri) {
        if (typeof uri === 'string') {
            const prevUrl: any = await this.url();

            let result;

            if (url.parse(prevUrl).path === url.parse(uri).path) {
                await this.url(uri);
                await this.refresh();
                result = this.documentReadyWait();
                await this.logNavigatorVersion();
                return result;
            } else {
                await this.url(uri);
                result = this.documentReadyWait();
                await this.logNavigatorVersion();
                return result;
            }
        } else if (typeof uri === 'function') {
            return uri(this);
        } else {
            throw new Error('Unsupported path type for openPage');
        }
    }

    public async isBecomeVisible(xpath, timeout = WAIT_TIMEOUT) {
        this.logger.debug(`Waiting for become visible ${utils.logXpath(xpath)} for ${timeout}`);

        xpath = this.normalizeSelector(xpath);

        try {
            await this.client.waitForVisible(xpath, timeout);
            return true;
        } catch {
            return false;
        }
    }

    public async isBecomeHidden(xpath, timeout = WAIT_TIMEOUT) {
        this.logger.debug(`Waiting for become hidden ${utils.logXpath(xpath)} for ${timeout}`);

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

            await this.pause(TICK_TIMEOUT);
        }
    }

    public async waitElementByLocator(xpath, timeout = WAIT_TIMEOUT) {
        const waitUntil = Date.now() + timeout;

        xpath = this.normalizeSelector(xpath);

        let isElementVisible = false;

        while (!isElementVisible && Date.now() < waitUntil) {
            isElementVisible = await this.client.isVisible(xpath);

            await this.pause(TICK_TIMEOUT);
        }

        return isElementVisible;
    }

    public async click(xpath, timeout = WAIT_TIMEOUT) {
        this.logger.debug(`Click on ${utils.logXpath(xpath)}`);

        const normalizedSelector = this.normalizeSelector(xpath);

        await this.waitForExist(normalizedSelector, timeout);
        await this.makeScreenshot();

        return this.client.click(normalizedSelector);
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

    public async getValue(xpath, timeout = WAIT_TIMEOUT) {
        this.logger.debug(`Get value from ${utils.logXpath(xpath)}`);
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);
        return this.client.getValue(xpath);
    }

    public async getTitle() {
        return this.client.getTitle();
    }

    public async setValue(xpath, value, emulateViaJS = false, timeout = WAIT_TIMEOUT) {
        this.logger.debug(`Set value ${value} to ${utils.logXpath(xpath)}`);
        await this.waitForExist(xpath, timeout);
        xpath = this.normalizeSelector(xpath);

        if (!emulateViaJS) {
            if (value === '' || value === null || typeof value === 'undefined') {
                await this.client.setValue(xpath, ' ');
                await this.client.keys(['Delete', 'Back space']);
            } else {
                await this.client.setValue(xpath, value);
            }

            this.logger.debug(`Value ${value} was entered into ${utils.logXpath(xpath)} using Selenium`);
        } else {
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
        }

        await this.makeScreenshot();
    }

    public async clickHiddenElement(xpath, timeout = WAIT_TIMEOUT) {
        this.logger.debug(`Make ${utils.logXpath(xpath)} visible and click`);
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

    public async getText(xpath, trim = true, timeout = WAIT_TIMEOUT) {
        const logXpath = utils.logXpath(xpath);

        this.logger.debug(`Get text from ${logXpath}`);

        await this.waitForExist(xpath, timeout);

        const text = (await this.getTextsInternal(xpath, trim)).join(' ');

        this.logger.debug(`Get text from ${logXpath} returns "${text}"`);

        return text;
    }

    public async getTooltipText(xpath, timeout = WAIT_TIMEOUT) {
        let logXpath = utils.logXpath(xpath);
        this.logger.debug(`Get tooltip text from ${logXpath}`);
        await this.waitForExist(xpath, timeout, true);

        let text = (await this.getTextsInternal(xpath, true)).join(' ');

        this.logger.debug(`Get tooltip text from ${logXpath} returns "${text}"`);
        return text;
    }

    public async getTexts(xpath, trim = true, timeout = WAIT_TIMEOUT) {
        let logXpath = utils.logXpath(xpath);
        this.logger.debug(`Get texts from ${logXpath}`);
        await this.waitForExist(xpath, timeout);

        let texts = await this.getTextsInternal(xpath, trim);

        this.logger.debug(`Get texts from ${logXpath} returns "${texts.join('\n')}"`);
        return texts;
    }

    public async getOptionsProperty(xpath, prop, timeout = WAIT_TIMEOUT) {
        this.logger.debug(`Get options ${prop} ${utils.logXpath(xpath)}`);
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

    public async getSelectTexts(xpath, trim = true) {
        const texts: string[] = (await this.getOptionsProperty(xpath, 'text'));

        if (!texts) {
            return [];
        }

        if (trim) {
            for (let i = 0; i < texts.length; i++) {
                texts[i].trim();
            }
        }
        return texts;
    }

    public async getSelectValues(xpath) {
        return (await this.getOptionsProperty(xpath, 'value')) || [];
    }

    public async selectNotCurrent(xpath) {
        let options: any[] = await this.getSelectValues(xpath);
        let value: any = await this.client.getValue(this.normalizeSelector(xpath));
        let index = options.indexOf(value);
        if (index > -1) {
            options.splice(index, 1);
        }
        await this.selectByValue(xpath, options[0]);
    }

    public async selectByIndex(xpath, value) {
        const logXpath = utils.logXpath(xpath);
        const errorMessage = `Could not select by index "${value}": ${logXpath}`;

        this.logger.debug(`Select by index ${logXpath} ${value}`);

        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath);

        try {
            return await this.client.selectByIndex(xpath, value);
        } catch (e) {
            e.message = errorMessage;
            throw e;
        }
    }

    public async selectByName(xpath, value) {
        const logXpath = utils.logXpath(xpath);
        const errorMessage = `Could not select by name "${value}": ${logXpath}`;

        this.logger.debug(`Select by name ${logXpath} ${value}`);

        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath);

        try {
            await this.client.selectByName(xpath, value);
        } catch (error) {
            error.message = errorMessage;
            throw error;
        }
    }

    public async selectByValue(xpath, value) {
        const logXpath = utils.logXpath(xpath);
        const errorMessage = `Could not select by value "${value}": ${logXpath}`;

        this.logger.debug(`Select by value ${logXpath} ${value}`);

        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath);

        try {
            return await this.client.selectByValue(xpath, value);
        } catch (error) {
            error.message = errorMessage;
            throw error;
        }
    }

    public async selectByVisibleText(xpath, value, timeout = WAIT_TIMEOUT) {
        const logXpath = utils.logXpath(xpath);
        const errorMessage = `Could not select by visible text "${value}": ${logXpath}`;

        this.logger.debug(`Select by visible text ${logXpath} ${value}`);

        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath, timeout);

        try {
            return await this.client.selectByVisibleText(xpath, String(value));
        } catch (e) {
            e.message = errorMessage;
            throw e;
        }
    }

    async getSelectedText(xpath, timeout = WAIT_TIMEOUT) {
        this.logger.debug(`Get selected text ${utils.logXpath(xpath)}`);

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

    async getElementsIds(xpath, timeout = WAIT_TIMEOUT) {
        await this.waitForExist(xpath, timeout);
        let elements: any = await this.elements(xpath);
        let elementIds: any[] = [];

        for (let i = 0; i < elements.length; i++) {
            let elem: any = elements[i];
            elementIds.push(elem.ELEMENT);
        }

        return (elementIds.length > 1) ? elementIds : elementIds[0];
    }

    async isElementSelected(elementId) {
        let elementSelected: any = await this.client.elementIdSelected(elementId.toString());

        return !!elementSelected;
    }

    async isChecked(xpath) {
        this.logger.debug(`Is checked/selected ${utils.logXpath(xpath)}`);

        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath);

        const isSelected = await this.client.isSelected(xpath);

        return !!isSelected;
    }

    async isSelected(xpath) {
        return this.isChecked(xpath);
    }

    async setChecked(xpath, checked = true) {
        this.logger.debug(`Set checked ${utils.logXpath(xpath)} ${!!checked}`);

        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath);

        const isChecked = await this.client.isSelected(xpath);

        if (!!isChecked !== !!checked) {
            return this.client.click(xpath);
        }
    }

    async isDisabled(xpath) {
        this.logger.debug(`Is disabled ${utils.logXpath(xpath)}`);

        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath);

        const disabled = await this.client.getAttribute(xpath, 'disabled');

        return (
            disabled === true ||
            disabled === 'true' ||
            disabled === 'disabled'
        );
    }

    async isReadOnly(xpath) {
        const logXpath = utils.logXpath(xpath);
        const inputTags = [
            'input',
            'select',
            'textarea'
        ];

        this.logger.debug(`Is read only ${logXpath}`);

        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath);

        const readonly: string = (await this.client.getAttribute(xpath, 'readonly')).toString();
        const str: string = await this.client.getTagName(xpath);

        if (
            readonly === 'true' ||
            readonly === 'readonly' ||
            readonly === 'readOnly' ||
            inputTags.indexOf(str) === -1
        ) {
            return true;
        }

        const disabled: string = (await this.client.getAttribute(xpath, 'disabled')).toString();

        return (
            disabled === 'true' ||
            disabled === 'disabled'
        );
    }

    public async maximizeWindow() {
        try {
            await this.client.windowHandleMaximize();
            return true;
        } catch (e) {
            this.logger.error(`failed to maxmize window, ${e}`);
            return false;
        }
    }

    public async isVisible(xpath, timeout = WAIT_TIMEOUT) {
        const logXpath = utils.logXpath(xpath);

        this.logger.debug(`Is visible ${logXpath}`);

        await this.waitForExist('', 0);

        xpath = this.normalizeSelector(xpath);

        return this.client.isVisible(xpath);
    }

    public async rootlessIsVisible(xpath) {
        let logXpath = utils.logXpath(xpath);
        this.logger.debug(`Is visible ${logXpath}`);
        xpath = this.normalizeSelector(xpath);
        return this.client.isVisible(xpath);
    }

    public async rootlessWaitForVisible(xpath) {
        this.logger.debug(`Is visible ${utils.logXpath(xpath)}`);

        return this.client.waitForVisible(this.normalizeSelector(xpath), 0);
    }

    public async getAttribute(xpath, attr, timeout = WAIT_TIMEOUT) {
        this.logger.debug(`Get attribute ${attr} from ${utils.logXpath(xpath)}`);

        xpath = this.normalizeSelector(xpath);

        await this.waitForExist(xpath, timeout);

        return this.client.getAttribute(xpath, attr);
    }

    public async isEnabled(xpath) {
        this.logger.debug(`Get attributes 'enabled' from ${utils.logXpath(xpath)}`);
        await this.waitForExist(xpath);

        xpath = this.normalizeSelector(xpath);
        return this.client.isEnabled(xpath);
    }

    public async isCSSClassExists(xpath, ...suitableClasses) {
        const elemClasses: any = await this.getAttribute(xpath, 'class');
        const elemClassesArr = elemClasses.trim().toLowerCase().split(/\s+/g);

        return suitableClasses.some((suitableClass) => elemClassesArr.includes(suitableClass.toLowerCase()));
    }

    public async moveToObject(xpath, x, y) {
        this.logger.debug(`Move cursor to ${utils.logXpath(xpath)}`);

        await this.waitForExist(xpath);

        xpath = this.normalizeSelector(xpath);
        return this.client.moveToObject(xpath, x || 1, y || 1);
    }

    public async scroll(xpath, x, y) {
        this.logger.debug(`Scroll ${utils.logXpath(xpath)}`);

        await this.waitForExist(xpath);

        xpath = this.normalizeSelector(xpath);
        return this.client.scroll(xpath, x || 1, y || 1);
    }

    public async dragAndDrop(xpathSource, xpathDestination) {
        // TODO This method doesn't work successfully, ReImplement
        await this.waitForExist(xpathSource);
        await this.waitForExist(xpathDestination);

        this.logger.debug(`dragAndDrop ${utils.logXpath(xpathSource)} to ${utils.logXpath(xpathDestination)}`);

        xpathSource = this.normalizeSelector(xpathSource);
        xpathDestination = this.normalizeSelector(xpathDestination);

        return this.client.dragAndDrop(xpathSource, xpathDestination);
    }

    public elements(xpath) {
        this.logger.debug(`elements ${utils.logXpath(xpath)}`);

        return this.client.elements(
            this.normalizeSelector(xpath)
        );
    }

    public async getElementsCount(xpath) {
        this.logger.debug(`Get elements count ${utils.logXpath(xpath)}`);

        await this.waitForExist(''); //root element xpath

        const elems: any = await this.elements(xpath);

        return elems.length;
    }

    public async notExists(xpath) {
        const elementsCount = await this.getElementsCount(
            this.normalizeSelector(xpath)
        );

        return (elementsCount === 0);
    }

    public async isElementsExist(xpath) {
        const elementsCount = await this.getElementsCount(
            this.normalizeSelector(xpath)
        );

        return (elementsCount > 0);
    }

    public async alertAccept(timeout = WAIT_TIMEOUT) {
        await this.waitForAlert(timeout);
        return this.client.alertAccept();
    }

    public async alertDismiss(timeout = WAIT_TIMEOUT) {
        await this.waitForAlert(timeout);
        return this.client.alertDismiss();
    }

    public async alertText(timeout = WAIT_TIMEOUT) {
        await this.waitForAlert(timeout);
        return this.client.alertText();
    }

    public async waitForAlert(timeout = WAIT_TIMEOUT) {
        const waitUntil = Date.now() + timeout;

        let isAlertVisible = false;

        while (!isAlertVisible && Date.now() < waitUntil) {
            try {
                await this.client.alertText();
                isAlertVisible = true;
            } catch (e) {
                await this.pause(TICK_TIMEOUT);
                isAlertVisible = false;
            }
        }

        return isAlertVisible;
    }

    public async closeBrowserWindow(focusToTabId = null) {
        return this.client.close(focusToTabId || this.mainTabID);
    }

    public async closeCurrentTab(focusToTabId = null) {
        await this.client.window(null);
        await this.setActiveTab(focusToTabId);
    }

    public async windowHandles() {
        return this.client.windowHandles();
    }

    public async window(handle) {
        return this.client.window(handle);
    }

    public async getTabIds() {
        return this.client.getTabIds();
    }

    public async getHTML(xpath) {
        this.logger.debug(`Get HTML from ${utils.logXpath(xpath)}`);
        await this.waitForExist(xpath, 0);

        xpath = this.normalizeSelector(xpath);
        return this.client.getHTML(xpath, true);
    }

    public async getCurrentTabId() {
        return this.client.getCurrentTabId();
    }

    public async switchTab(tabId) {
        return this.client.switchTab(tabId);
    }

    public async closeAllOtherTabs() {
        let tabIds: any = await this.getTabIds();

        while (tabIds.length > 1) {
            await this.closeFirstSiblingTab();

            tabIds = await this.getTabIds();
        }
    }

    public async setActiveTab(tabId) {
        this.logger.debug(`Switching to tab ${tabId}`);

        await this.switchTab(tabId);
        await this.window(tabId);
    }

    public async closeFirstSiblingTab() {
        await this.switchToFirstSiblingTab();
        await this.closeBrowserWindow();
    }

    public async switchToFirstSiblingTab() {
        const tabIds: Array<number> = await this.getTabIds();
        const siblingTabs = tabIds.filter(tabId => tabId !== this.mainTabID);

        if (siblingTabs.length === 0) {
            return false;
        }

        await this.setActiveTab(siblingTabs[0]);
        return true;
    }

    public async switchToMainSiblingTab() {
        let tabIds: any = await this.getTabIds();
        tabIds = tabIds.filter(tabId => tabId === this.mainTabID);

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
        return this.client.parentFrame();
    }

    private async getTextsInternal(xpath, trim) {
        xpath = this.normalizeSelector(xpath);

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

    public async clearElement(xpath) {
        this.logger.debug(`Clear element ${utils.logXpath(xpath)}`);

        await this.waitForExist(xpath);

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

    public getTextsAsArray(xpath, trim = true, timeout = WAIT_TIMEOUT) {
        return this.getTexts(xpath, trim, timeout);
    }

    public async makeScreenshot() {
        const screenshoot = await this.client.makeScreenshot();
        const screenDate = new Date();
        const formattedDate = (`${screenDate.toLocaleTimeString()} ${screenDate.toDateString()}`).replace(/\s+/g, '_');

        this.logger.media(
            `${this.testUID}-${formattedDate}-${nanoid(5)}.png`,
            screenshoot
        );
    }

    public uploadFile(fullPath) {
        return this.client.uploadFile(fullPath);
    }

    public async end() {
        await this.client.end();
    }
}
