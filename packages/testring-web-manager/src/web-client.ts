import { transport } from '@testring/transport';

import { WebManagerMessageType } from './structs';
import { IExecuteMessage, IResponseMessage } from './interfaces';
import { BrowserProxyActions } from '../../testring-browser-proxy/src/structs';

const nanoid = require('nanoid');

export class WebClient {

    private makeRequest(command, args) {
        return new Promise((resolve, reject) => {
            let uid = nanoid();
            let request: IExecuteMessage = {
                uid: uid,
                command: {
                    action: command,
                    args: args
                }
            };
            const removeListener = transport.on(WebManagerMessageType.response, (message: IResponseMessage) => {
                if (message.uid === uid) {
                    removeListener();

                    if (message.error) {
                        reject(message.error);
                    } else {
                        resolve(message.response);
                    }
                }
            });

            transport.broadcast(WebManagerMessageType.execute, request);

        });
    }

    public async refresh() {
        return await this.makeRequest(BrowserProxyActions.refresh, []);
    }

    public async click(xpath) {
        return await this.makeRequest(BrowserProxyActions.click, [xpath]);
    }

    public async gridProxyDetails() {
        return await this.makeRequest(BrowserProxyActions.gridProxyDetails, []);
    }

    public async url(val) {
        return await this.makeRequest(BrowserProxyActions.url, [val]);
    }

    public async waitForExist(xpath, timeout) {
        return await this.makeRequest(BrowserProxyActions.waitForExist, [xpath, timeout]);
    }

    public async waitForVisible(xpath, timeout) {
        return await this.makeRequest(BrowserProxyActions.waitForVisible, [xpath, timeout]);
    }

    public async isVisible(xpath) {
        return await this.makeRequest(BrowserProxyActions.isVisible, [xpath]);
    }

    public async moveToObject(xpath, x, y) {
        return await this.makeRequest(BrowserProxyActions.moveToObject, [xpath, x, y]);
    }

    public async execute(fn, ...args) {
        return {value: ''};
    }

    public async executeAsync(fn, ...args) {
        return {value: 'value'};
    }

    public async getTitle() {
        return await this.makeRequest(BrowserProxyActions.getTitle, []);
    }

    public async clearElement(xpath) {
        return await this.makeRequest(BrowserProxyActions.clearElement, [xpath]);
    }

    public async keys(value) {
        return await this.makeRequest(BrowserProxyActions.keys, [value]);
    }

    public async elementIdText(elementId) {
        return await this.makeRequest(BrowserProxyActions.elementIdText, [elementId]);
    }

    public async elements(xpath) {
        return await this.makeRequest(BrowserProxyActions.elements, [xpath]);
    }

    public async getValue(xpath) {
        return await this.makeRequest(BrowserProxyActions.getValue, [xpath]);
    }

    public async setValue(xpath, value) {
        return await this.makeRequest(BrowserProxyActions.setValue, [xpath, value]);
    }

    public async selectByIndex(xpath, value) {
        return await this.makeRequest(BrowserProxyActions.selectByIndex, [xpath, value]);
    }

    public async selectByValue(xpath, value) {
        return await this.makeRequest(BrowserProxyActions.selectByValue, [xpath, value]);
    }

    public async selectByName(xpath, value) {
        return await this.makeRequest(BrowserProxyActions.selectByName, [xpath, value]);
    }

    public async selectByVisibleText(xpath, str) {
        return await this.makeRequest(BrowserProxyActions.selectByVisibleText, [xpath, str]);
    }

    public async getAttribute(xpath, attr) {
        return await this.makeRequest(BrowserProxyActions.getAttribute, [xpath, attr]);
    }

    public async windowHandleMaximize() {
        return await this.makeRequest(BrowserProxyActions.windowHandleMaximize, []);
    }

    public async isEnabled(xpath) {
        return await this.makeRequest(BrowserProxyActions.isEnabled, [xpath]);
    }

    public async scroll(xpath, x, y) {
        return await this.makeRequest(BrowserProxyActions.scroll, [xpath, x, y]);
    }

    public async alertAccept() {
        return await this.makeRequest(BrowserProxyActions.alertAccept, []);
    }

    public async alertDismiss() {
        return await this.makeRequest(BrowserProxyActions.alertAccept, []);
    }

    public async alertText() {
        return await this.makeRequest(BrowserProxyActions.alertText, []);
    }

    public async dragAndDrop(xpathSource, xpathDestination) {
        return await this.makeRequest(BrowserProxyActions.dragAndDrop, [xpathSource, xpathDestination]);
    }

    public async addCommand(str, fn) {
        return await this.makeRequest(BrowserProxyActions.addCommand, [str, fn]);
    }

    public async toFrame(name) {
        return await this.makeRequest(BrowserProxyActions.toFrame, [name]);
    }

    public async getCookie(cookieName) {
        return await this.makeRequest(BrowserProxyActions.getCookie, [cookieName]);
    }

    public async deleteCookie(cookieName) {
        return await this.makeRequest(BrowserProxyActions.deleteCookie, [cookieName]);
    }

    public async getHTML(xpath, b) {
        return await this.makeRequest(BrowserProxyActions.getHTML, [xpath, b]);
    }

    public async getCurrentTabId() {
        return await this.makeRequest(BrowserProxyActions.getCurrentTabId, []);
    }

    public async switchTab(tabId) {
        return await this.makeRequest(BrowserProxyActions.switchTab, [tabId]);
    }

    public async close(tabId) {
        return await this.makeRequest(BrowserProxyActions.close, [tabId]);
    }

    public async getTabIds() {
        return await this.makeRequest(BrowserProxyActions.getTabIds, []);
    }

    public async window(fn) {
        return await this.makeRequest(BrowserProxyActions.window, [fn]);
    }

    public async windowHandles() {
        return await this.makeRequest(BrowserProxyActions.windowHandles, []);
    }

    public async toParent() {
        return await this.makeRequest(BrowserProxyActions.toParent, []);
    }

    public async getTagName(xpath) {
        return await this.makeRequest(BrowserProxyActions.getTagName, [xpath]).toString();
    }

    public async isSelected(xpath) {
        return await this.makeRequest(BrowserProxyActions.isSelected, [xpath]);
    }

    public async getText(xpath) {
        return await this.makeRequest(BrowserProxyActions.getText, [xpath]);
    }

    public async elementIdSelected(id) {
        return await this.makeRequest(BrowserProxyActions.elementIdSelected, [id]);
    }
}
