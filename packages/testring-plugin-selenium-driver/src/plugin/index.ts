import { IBrowserProxyPlugin } from '@testring/types';
import { Config, Client, remote } from 'webdriverio';

class SeleniumPlugin implements IBrowserProxyPlugin {

    private browserClient: Client<void>;

    constructor(config: Config) {
        this.browserClient = remote(config);
    }

    async refresh() {
        return this.browserClient.refresh();
    }

    async click(selector: string) {
        return this.browserClient.click(selector);
    }
    async gridProxyDetails() {
        return this.browserClient.gridProxyDetails();
    }

    async url(val: string) {
        return this.browserClient.url(val);
    }

    async waitForExist(xpath: string, timeout: number) {
        return this.browserClient.waitForExist(xpath, timeout);
    }

    async waitForVisible(xpath: string, timeout: number) {
        return this.browserClient.waitForVisible(xpath, timeout);
    }

    async isVisible(xpath: string) {
        return this.browserClient.isVisible(xpath);
    }

    async moveToObject(xpath: string, x: number, y: number) {
        return this.browserClient.moveToObject(xpath, x, y);
    }

    async execute(fn: any, args: Array<any>) {
        return this.browserClient.execute(fn, ...args);
    }

    async executeAsync(fn: any, args: Array<any>) {
        return this.browserClient.executeAsync(fn, ...args);
    }

    async getTitle() {
        return this.browserClient.getTitle();
    }

    async clearElement(xpath: string) {
        return this.browserClient.clearElement(xpath);
    }

    async keys(value: any) {
        this.browserClient.keys(value);
    }

    async elementIdText(elementId: string) {
        return this.browserClient.elementIdText(elementId);
    }

    async elements(xpath: string) {
        return this.browserClient.elements(xpath);
    }

    async getValue(xpath: string) {
        return this.browserClient.getValue(xpath);
    }

    async setValue(xpath: string, value: any) {
        return this.browserClient.setValue(xpath, value);
    }

    async selectByIndex(xpath: string, value: any) {
        return this.browserClient.selectByIndex(xpath, value);
    }

    async selectByValue(xpath: string, value: any) {
        return this.browserClient.selectByValue(xpath, value);
    }

    async selectByVisibleText(xpath: string, str: string) {
        return this.browserClient.selectByVisibleText(xpath, str);
    }

    async getAttribute(xpath: string, attr: any) {
        this.browserClient.getAttribute(xpath, attr);
    }

    async windowHandleMaximize() {
        return this.browserClient.windowHandleMaximize();
    }

    async isEnabled(xpath: string) {
        return this.browserClient.isEnabled(xpath);
    }

    async scroll(xpath: string, x: number, y: number) {
        return this.browserClient.scroll(xpath, x, y);
    }

    async alertAccept() {
        return this.browserClient.alertAccept();
    }

    async alertDismiss() {
        return this.browserClient.alertDismiss();
    }

    async alertText() {
        return this.browserClient.alertText();
    }

    async dragAndDrop(xpathSource: string, xpathDestination: string) {
        return this.browserClient.dragAndDrop(xpathSource, xpathDestination);
    }

    async addCommand(str: string, fn: any) {
        return this.browserClient.addCommand(str, fn);
    }

    async getCookie(cookieName: string) {
        return this.browserClient.getCookie(cookieName);
    }

    async deleteCookie(cookieName: string) {
        return this.browserClient.deleteCookie(cookieName);
    }

    async getHTML(xpath: string, b: any) {
        return this.browserClient.getHTML(xpath, b);
    }

    async getCurrentTableId() {
        return this.browserClient.getCurrentTabId();
    }

    async switchTab(tabId: string) {
        return this.browserClient.switchTab(tabId);
    }

    async close(tabId: string) {
        return this.browserClient.close(tabId);
    }

    async getTabIds() {
        return this.browserClient.getTabIds();
    }

    async window(fn: any) {
        return this.browserClient.window(fn);
    }

    async windowHandles() {
        return this.browserClient.windowHandles();
    }


    async getTagName(xpath: string) {
        return this.browserClient.getTagName(xpath);
    }

    async isSelected(xpath: string) {
        return this.browserClient.isSelected(xpath);
    }

    async getText(xpath: string) {
        return this.browserClient.getText(xpath);
    }

    async elementIdSelected(id: string) {
        return this.browserClient.elementIdSelected(id);
    }
}

export default function seleniumProxy(config: Config) {
    return new SeleniumPlugin(config);
}
