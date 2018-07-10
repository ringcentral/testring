/* eslint-disable */

import * as url from 'url';
import { ITransport } from '@testring/types';
import { loggerClient } from '@testring/logger';
import { PluggableModule } from '@testring/pluggable-module';
import { createElementPath, ElementPath } from '@testring/element-path';
import { createAssertion } from './assert';
import { WebClient } from './web-client';
import * as utils from './utils';

const WAIT_TIMEOUT = 30000;
const TICK_TIMEOUT = 100;

export class WebApplication extends PluggableModule {

    protected client: WebClient;

    private mainTabID = 1;

    public assert = createAssertion(false);

    public softAssert = createAssertion(true);

    public root = createElementPath();

    constructor(testUID: string, transport: ITransport) {
        super();

        this.client = new WebClient(testUID, transport);
    }

    protected logXpath(xpath) {
        return utils.logXpath(xpath);
    }

    protected normalizeSelector(selector: string | ElementPath): string {
        if (typeof selector === 'string') {
            return selector;
        }

        return selector.toString();
    }

    public async waitForExist(xpath, timeout: number = WAIT_TIMEOUT, skipMoveToObject = false) {
        loggerClient.log(`Waiting ${xpath} for ${timeout}`);

        const exists = await this.client.waitForExist(xpath, timeout);

        if (!skipMoveToObject) {
            try {
                await this.client.moveToObject(xpath, 1, 1);
            } catch (ignore) {
            }
        }

        return exists;
    }

    public async waitForNotExists(xpath, timeout = WAIT_TIMEOUT) {
        let exists = false;
        try {
            xpath = this.normalizeSelector(xpath);
            loggerClient.log(`Waiting not exists ${xpath} for ${timeout}`);
            await this.client.waitForExist(xpath, Number(timeout) || WAIT_TIMEOUT);
            exists = true;
        } catch (ignore) {
        }

        if (exists) {
            throw new Error(`Wait for not exists failed, element ${utils.logXpath(xpath)} is exists`);
        }
    }

    public async waitForNotVisible(xpath, timeout = WAIT_TIMEOUT) {
        const path = utils.logXpath(xpath);
        const expires = Date.now() + timeout;

        xpath = this.normalizeSelector(xpath);

        loggerClient.log(`Waiting for not visible ${path} for ${timeout}`);

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

        loggerClient.log(`Waiting for visible ${utils.logXpath(xpath)} for ${waitTime}`);

        return this.client.waitForVisible(xpath, waitTime);
    }

    public async openPage(uri) {
        if (typeof uri === 'string') {
            return this._open(uri);
        } else if (typeof uri === 'function') {
            return uri(this);
        } else {
            throw new Error('Unsupported path type for openPage');
        }
    }

    public async _open(val) {
        let prevUrlObj: any = await this.url();
        let result;

        let prevUrl = prevUrlObj.value;

        if (url.parse(prevUrl).path === url.parse(val).path) {
            await this.url(val);
            await this.refresh();
            result = this._documentReadyWait();
            await this.logNavigatorVersion();
            return result;
        } else {
            await this.url(val);
            result = this._documentReadyWait();
            await this.logNavigatorVersion();
            return result;
        }
    }

    public async isBecomeVisible(xpath, timeout = WAIT_TIMEOUT) {
        loggerClient.log(`Waiting for become visible ${utils.logXpath(xpath)} for ${timeout}`);
        xpath = this.normalizeSelector(xpath);
        try {
            await this.client.waitForVisible(xpath, timeout);
            return true;
        } catch (ignore) {
            return false;
        }
    }

    public async isBecomeHidden(xpath, timeout = WAIT_TIMEOUT) {
        loggerClient.log(`Waiting for become hidden ${utils.logXpath(xpath)} for ${timeout}`);

        const expires = Date.now() + timeout;
        xpath = this.normalizeSelector(xpath);

        while (true) {
            let visible = await this.client.isVisible(xpath);

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
        loggerClient.log(`Click on ${utils.logXpath(xpath)}`);

        await this.waitForExist(xpath, timeout);
        await this.makeScreenshot();
        
        xpath = this.normalizeSelector(xpath);
        return this.client.click(xpath);
    }

    public async logNavigatorVersion() {
        const userAgent = await this.execute(function() {
            return window.navigator && window.navigator.userAgent;
        });

        loggerClient.log(userAgent.value);
    }

    _documentReadyWait() {
        const attemptCount = 1000;
        const attemptInterval = 200;

        return new Promise(async (resolve, reject) => {
            let i = 0;
            let result = false;
            while (i < attemptCount) {
                const ready = { value: '' };

                await this.execute(() => document.readyState === 'complete');

                if (ready && ready.value) {
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
        loggerClient.log(`Get value from ${utils.logXpath(xpath)}`);
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);
        return this.client.getValue(xpath);
    }

    public async getTitle() {
        return this.client.getTitle();
    }

    public async setValue(xpath, value, emulateViaJS = false, timeout = WAIT_TIMEOUT) {
        loggerClient.log(`Set value ${value} to ${utils.logXpath(xpath)}`);
        await this.waitForExist(xpath, timeout);
        xpath = this.normalizeSelector(xpath);

        if (!emulateViaJS) {
            if (value === '' || value === null || typeof value === 'undefined') {
                await this.client.setValue(xpath, ' ');
                await this.client.keys(['Delete', 'Back space']);
            } else {
                await this.client.setValue(xpath, value);
            }

            loggerClient.log(`Value ${value} was entered into ${utils.logXpath(xpath)} using Selenium`);
        } else {
            let result = await this.client.executeAsync(function(xpath, value, done) {

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

            if (result.value) {
                throw new Error(result.value);
            } else {
                loggerClient.log(`Value ${value} was entered into ${utils.logXpath(xpath)} using JS emulation`);
            }
        }

        await this.makeScreenshot();
    }

    public async clickHiddenElement(xpath, timeout = WAIT_TIMEOUT) {
        loggerClient.log(`Make ${utils.logXpath(xpath)} visible and click`);
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

        if (result.value) {
            throw new Error(result.value);
        } else {
            loggerClient.log(`Element ${utils.logXpath(xpath)} was made visible and clicked`);
        }

        await this.makeScreenshot();
    }

    public async getText(xpath, trim = true, timeout = WAIT_TIMEOUT) {
        const logXpath = utils.logXpath(xpath);

        loggerClient.log(`Get text from ${logXpath}`);

        await this.waitForExist(xpath, timeout);

        const text = (await this._getTextsInternal(xpath, trim)).join(' ');

        loggerClient.log(`Get text from ${logXpath} returns "${text}"`);

        return text;
    }

    public async getTooltipText(xpath, timeout = WAIT_TIMEOUT) {
        let logXpath = utils.logXpath(xpath);
        loggerClient.log(`Get tooltip text from ${logXpath}`);
        await this.waitForExist(xpath, timeout, true);

        let text = (await this._getTextsInternal(xpath, true)).join(' ');

        loggerClient.log(`Get tooltip text from ${logXpath} returns "${text}"`);
        return text;
    }

    public async getTexts(xpath, trim = true, timeout = WAIT_TIMEOUT) {
        let logXpath = utils.logXpath(xpath);
        loggerClient.log(`Get texts from ${logXpath}`);
        await this.waitForExist(xpath, timeout);

        let texts = await this._getTextsInternal(xpath, trim);

        loggerClient.log(`Get texts from ${logXpath} returns "${texts.join('\n')}"`);
        return texts;
    }

    public async getOptionsProperty(xpath, prop, timeout = WAIT_TIMEOUT) {
        loggerClient.log(`Get options ${prop} ${utils.logXpath(xpath)}`);
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);

        let result = await this.client.executeAsync(function(xpath, prop, done) {
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
                let element = getElementByXPath(xpath);

                if (element && element.tagName.toLowerCase() === 'select') {
                    const texts: Array<any> = [];

                    for (let i = 0, len = element.options.length; i < len; i++) {
                        texts.push(element.options[i][prop]);
                    }

                    done(texts);
                } else {
                    throw Error(`Element not found ${xpath}`);
                }
            } catch (e) {
                throw Error(`${e.message} ${xpath}`);
            }
        }, xpath, prop);

        return result.value;
    }

    public async getSelectTexts(xpath, trim = true) {
        let texts: string[] = (await this.getOptionsProperty(xpath, 'text')) || [];
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
        let logXpath = utils.logXpath(xpath);
        const errorMessage = `Could not select by index "${value}": ${logXpath}`;
        loggerClient.log(`Select by index ${logXpath} ${value}`);
        await this.waitForExist(xpath);

        xpath = this.normalizeSelector(xpath);
        try {
            return await this.client.selectByIndex(xpath, value);
            // return this.fixNativeDropdownInteraction(xpath);
        } catch (e) {
            e.message = errorMessage;
            throw e;
        }
    }

    public async selectByName(xpath, value) {
        let logXpath = utils.logXpath(xpath);
        const errorMessage = `Could not select by name "${value}": ${logXpath}`;
        loggerClient.log(`Select by name ${logXpath} ${value}`);
        await this.waitForExist(xpath);

        xpath = this.normalizeSelector(xpath);
        try {
            await this.client.selectByName(xpath, value);
            //return await this.fixNativeDropdownInteraction(xpath);
        } catch (e) {
            e.message = errorMessage;
            throw e;
        }
    }

    public async selectByValue(xpath, value) {
        let logXpath = utils.logXpath(xpath);
        const errorMessage = `Could not select by value "${value}": ${logXpath}`;
        loggerClient.log(`Select by value ${logXpath} ${value}`);
        await this.waitForExist(xpath);

        xpath = this.normalizeSelector(xpath);
        try {
            return await this.client.selectByValue(xpath, value);
            // return this.fixNativeDropdownInteraction(xpath);
        } catch (e) {
            e.message = errorMessage;
            throw e;
        }
    }

    public async selectByVisibleText(xpath, value, timeout = WAIT_TIMEOUT) {
        let logXpath = utils.logXpath(xpath);
        const errorMessage = `Could not select by visible text "${value}": ${logXpath}`;
        loggerClient.log(`Select by visible text ${logXpath} ${value}`);
        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);
        try {
            return await this.client.selectByVisibleText(xpath, String(value));
            // return this.fixNativeDropdownInteraction(xpath);
        } catch (e) {
            e.message = errorMessage;
            throw e;
        }
    }

    async fixNativeDropdownInteraction(xpath) {
        await this.makeScreenshot();

        await this.client.waitForExist(xpath, WAIT_TIMEOUT);
        return this.client.click(xpath);
    }

    async getSelectedText(xpath, timeout = WAIT_TIMEOUT) {
        loggerClient.log(`Get selected text ${utils.logXpath(xpath)}`);

        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);
        let value = await this.client.getValue(xpath);
        if (typeof value === 'string' || typeof value === 'number') {
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
        let elementsArr: any[] = elements.value;
        let elementIds: any[] = [];
        for (let i = 0; i < elementsArr.length; i++) {
            let elem: any = elementsArr[i];
            elementIds.push(elem.ELEMENT);
        }
        return (elementIds.length > 1) ? elementIds : elementIds[0];
    }

    async isElementSelected(elementId) {
        let elementSelected: any = await this.client.elementIdSelected(elementId.toString());
        return !!elementSelected.value;
    }

    async isChecked(xpath) {
        loggerClient.log(`Is checked/selected ${utils.logXpath(xpath)}`);
        await this.waitForExist(xpath);

        xpath = this.normalizeSelector(xpath);
        return !!(await this.client.isSelected(xpath));
    }

    async isSelected(xpath) {
        return this.isChecked(xpath);
    }

    async setChecked(xpath, checked = true) {
        let logXpath = utils.logXpath(xpath);
        loggerClient.log(`Set checked ${logXpath} ${!!checked}`);
        await this.waitForExist(xpath);

        xpath = this.normalizeSelector(xpath);
        let isChecked = await this.client.isSelected(xpath);
        if (!!isChecked !== !!checked) {
            return this.client.click(xpath);
        }
    }

    async isDisabled(xpath) {
        loggerClient.log(`Is disabled ${utils.logXpath(xpath)}`);
        await this.waitForExist(xpath);

        xpath = this.normalizeSelector(xpath);
        let disabled = await this.client.getAttribute(xpath, 'disabled');
        return (
            disabled === true ||
            disabled === 'true' ||
            disabled === 'disabled'
        );
    }

    async isReadOnly(xpath) {
        let logXpath = utils.logXpath(xpath);
        let inputTags = [
            'input',
            'select',
            'textarea'
        ];
        loggerClient.log(`Is read only ${logXpath}`);
        await this.waitForExist(xpath);

        xpath = this.normalizeSelector(xpath);
        let readonly: string = (await this.client.getAttribute(xpath, 'readonly')).toString();
        let str: string = await this.client.getTagName(xpath);
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
            return await this.client.windowHandleMaximize();
        } catch (e) {
            loggerClient.log(`failed to maxmize window, ${e}`);
            return false;
        }
    }

    public async isVisible(xpath, timeout = WAIT_TIMEOUT) {
        let logXpath = utils.logXpath(xpath);
        loggerClient.log(`Is visible ${logXpath}`);
        await this.waitForExist('', 0);

        xpath = this.normalizeSelector(xpath);
        return this.client.isVisible(xpath);
    }

    public async rootlessIsVisible(xpath) {
        let logXpath = utils.logXpath(xpath);
        loggerClient.log(`Is visible ${logXpath}`);
        xpath = this.normalizeSelector(xpath);
        return this.client.isVisible(xpath);
    }

    public async rootlessWaitForVisible(xpath) {
        let logXpath = utils.logXpath(xpath);
        loggerClient.log(`Is visible ${logXpath}`);
        xpath = this.normalizeSelector(xpath);
        return this.client.waitForVisible(xpath, 0);
    }

    public async getAttribute(xpath, attr, timeout = WAIT_TIMEOUT) {
        loggerClient.log(`Get attribute ${attr} from ${utils.logXpath(xpath)}`);

        await this.waitForExist(xpath, timeout);

        xpath = this.normalizeSelector(xpath);
        return this.client.getAttribute(xpath, attr);
    }

    public async isEnabled(xpath) {
        loggerClient.log(`Get attributes 'enabled' from ${utils.logXpath(xpath)}`);
        await this.waitForExist(xpath);

        xpath = this.normalizeSelector(xpath);
        return this.client.isEnabled(xpath);
    }

    public async isEnabledOldUI(xpath) {
        let isEnabled = false;
        loggerClient.log(`Get attributes 'enabled' from ${utils.logXpath(xpath)}`);
        if (await this.isElementsExist(xpath)) {
            xpath = this.normalizeSelector(xpath);
            let attribute: any = await this.client.getAttribute(xpath, 'class');
            isEnabled = attribute.indexOf('disabled') === -1;
        }
        return isEnabled;
    }

    public async isCSSClassExists(xpath, ...suitableClasses) {
        const elemClasses: any = await this.getAttribute(xpath, 'class');
        const elemClassesArr = elemClasses.trim().toLowerCase().split(/\s+/g);
        return suitableClasses.some((suitableClass) => elemClassesArr.includes(suitableClass.toLowerCase()));
    }

    public async moveToObject(xpath, x, y) {
        loggerClient.log(`Move cursor to ${utils.logXpath(xpath)}`);
        await this.waitForExist(xpath);

        xpath = this.normalizeSelector(xpath);
        return this.client.moveToObject(xpath, x || 1, y || 1);
    }

    public async scroll(xpath, x, y) {
        loggerClient.log(`Scroll ${utils.logXpath(xpath)}`);
        await this.waitForExist(xpath);

        xpath = this.normalizeSelector(xpath);
        return this.client.scroll(xpath, x || 1, y || 1);
    }

    public async dragAndDrop(xpathSource, xpathDestination) {
        // TODO This method doesn't work successfully, ReImplement
        await this.waitForExist(xpathSource);
        await this.waitForExist(xpathDestination);

        loggerClient.log(`dragAndDrop ${utils.logXpath(xpathSource)} to ${utils.logXpath(xpathDestination)}`);
        
        xpathSource = this.normalizeSelector(xpathSource);
        xpathDestination = this.normalizeSelector(xpathDestination);
        
        return this.client.dragAndDrop(xpathSource, xpathDestination);
    }

    public async elements(xpath) {
        loggerClient.log(`elements ${utils.logXpath(xpath)}`);
        xpath = this.normalizeSelector(xpath);
        return this.client.elements(xpath);
    }

    public async getElementsCount(xpath) {
        loggerClient.log(`Get elements count ${utils.logXpath(xpath)}`);
        await this.waitForExist(''); //root element xpath

        let elems: any = await this.elements(xpath);
        return elems.value.length;
    }

    public async notExists(xpath) {
        return ((await this.getElementsCount(xpath)) === 0);
    }

    public async isElementsExist(xpath) {
        return ((await this.getElementsCount(xpath)) > 0);
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
        loggerClient.log(`Get HTML from ${utils.logXpath(xpath)}`);
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
        loggerClient.log(`Switching to tab ${tabId}`);
        await this.switchTab(tabId);
        await this.window(tabId);
    }

    public async closeFirstSiblingTab() {
        await this.switchToFirstSiblingTab();
        await this.closeBrowserWindow();
    }

    public async switchToFirstSiblingTab() {
        let tabIds: any = await this.getTabIds();
        tabIds = tabIds.filter(tabId => tabId !== this.mainTabID);

        if (tabIds[0]) {
            await this.setActiveTab(tabIds[0]);
            return true;
        }
        return false;
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

    public async getCookie(cookieName) {
        return await this.client.getCookie(cookieName);
    }

    public async deleteCookie(cookieName) {
        return await this.client.deleteCookie(cookieName);
    }

    getPlaceHolderValue(xpath) {
        return this.getAttribute(xpath, 'placeholder');
    }

    async switchToFrame(name) {
        this.client.addCommand('toFrame', function(frameName) {
            return this.frame(frameName);
        });

        return this.client.toFrame(name);
    }

    async switchToParentFrame() {
        this.client.addCommand('toParent', function() {
            return this.frameParent();
        });
        return this.client.toParent();
    }

    async _getTextsInternal(xpath, trim) {
        xpath = this.normalizeSelector(xpath);

        let result: string[] = [];

        let elements: any = await this.client.elements(xpath);
        for (let item of elements.value) {
            let response: any = await this.client.elementIdText(item.ELEMENT);
            if (trim) {
                result.push(response.value.trim());
            } else {
                result.push(response.value);
            }
        }

        return result;
    }

    async execute(fn, ...args) {
        return this.client.execute(fn, ...args);
    }

    async pause(timeout) {
        loggerClient.debug(`DELAY for ${timeout}ms`);

        return new Promise(resolve => setTimeout(resolve, timeout));
    }

    async url(val?: string) {
        return this.client.url(val);
    }

    async clearElement(xpath) {
        loggerClient.debug(`Clear element ${utils.logXpath(xpath)}`);

        await this.waitForExist(xpath);

        xpath = this.normalizeSelector(xpath);
        return this.client.clearElement(xpath);
    }

    async keys(value) {
        loggerClient.debug(`Send keys ${value}`);

        return this.client.keys(value);
    }

    public async refresh() {
        await this.client.refresh();
    }

    async getTextsAsArray(xpath, trim = true, timeout = WAIT_TIMEOUT) {
        return this.getTexts(xpath, trim, timeout);
    }

    public async makeScreenshot() {
        const screenshoot = await this.client.makeScreenshot();

        // TODO make normal screenshot save with name
        loggerClient.media('screenshot.png', screenshoot);
    }

    public async uploadFile(fullPath) {
        await this.client.uploadFile(fullPath);
    }

    public async end() {
        await this.client.end();
    }
}
