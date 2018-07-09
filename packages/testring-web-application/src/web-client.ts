import { ITransport, BrowserProxyActions } from '@testring/types';
import { IExecuteMessage, IResponseMessage } from './interfaces';
import { WebApplicationMessageType } from './structs';

const nanoid = require('nanoid');

export class WebClient {

    constructor(private applicant: string, private transport: ITransport) {
    }

    private makeRequest(action: BrowserProxyActions, args: Array<any>): Promise<any> {
        const transport = this.transport;

        return new Promise((resolve, reject) => {
            const uid = nanoid();
            const request: IExecuteMessage = {
                uid: uid,
                applicant: this.applicant,
                command: {
                    action: action,
                    args: args
                }
            };

            const removeListener = transport.on<IResponseMessage>(
                WebApplicationMessageType.response,
                (message) => {
                    if (message.uid === uid) {
                        removeListener();

                        if (message.error) {
                            reject(message.error);
                        } else {
                            resolve(message.response);
                        }
                    }
                }
            );

            transport.broadcast(WebApplicationMessageType.execute, request);
        });
    }

    public end() {
        return this.makeRequest(BrowserProxyActions.end, []);
    }

    public refresh() {
        return this.makeRequest(BrowserProxyActions.refresh, []);
    }

    public click(xpath) {
        return this.makeRequest(BrowserProxyActions.click, [xpath]);
    }

    public gridProxyDetails() {
        return this.makeRequest(BrowserProxyActions.gridProxyDetails, []);
    }

    public url(val) {
        return this.makeRequest(BrowserProxyActions.url, [val]);
    }

    public waitForExist(xpath, timeout) {
        return this.makeRequest(BrowserProxyActions.waitForExist, [xpath, timeout]);
    }

    public waitForVisible(xpath, timeout) {
        return this.makeRequest(BrowserProxyActions.waitForVisible, [xpath, timeout]);
    }

    public isVisible(xpath) {
        return this.makeRequest(BrowserProxyActions.isVisible, [xpath]);
    }

    public moveToObject(xpath, x, y) {
        return this.makeRequest(BrowserProxyActions.moveToObject, [xpath, x, y]);
    }

    public execute(fn, ...args) {
        return this.makeRequest(BrowserProxyActions.execute, [fn, args]);
    }

    public executeAsync(fn, ...args) {
        return this.makeRequest(BrowserProxyActions.executeAsync, [fn, args]);
    }

    public timeoutsAsyncScript(timeout, fn) {
        return this.makeRequest(BrowserProxyActions.timeoutsAsyncScript, [timeout, fn]);
    }

    public getTitle() {
        return this.makeRequest(BrowserProxyActions.getTitle, []);
    }

    public clearElement(xpath) {
        return this.makeRequest(BrowserProxyActions.clearElement, [xpath]);
    }

    public keys(value) {
        return this.makeRequest(BrowserProxyActions.keys, [value]);
    }

    public elementIdText(elementId) {
        return this.makeRequest(BrowserProxyActions.elementIdText, [elementId]);
    }

    public elements(xpath) {
        return this.makeRequest(BrowserProxyActions.elements, [xpath]);
    }

    public getValue(xpath) {
        return this.makeRequest(BrowserProxyActions.getValue, [xpath]);
    }

    public setValue(xpath, value) {
        return this.makeRequest(BrowserProxyActions.setValue, [xpath, value]);
    }

    public selectByIndex(xpath, value) {
        return this.makeRequest(BrowserProxyActions.selectByIndex, [xpath, value]);
    }

    public selectByValue(xpath, value) {
        return this.makeRequest(BrowserProxyActions.selectByValue, [xpath, value]);
    }

    public selectByName(xpath, value) {
        return this.makeRequest(BrowserProxyActions.selectByName, [xpath, value]);
    }

    public selectByVisibleText(xpath, str) {
        return this.makeRequest(BrowserProxyActions.selectByVisibleText, [xpath, str]);
    }

    public getAttribute(xpath, attr) {
        return this.makeRequest(BrowserProxyActions.getAttribute, [xpath, attr]);
    }

    public windowHandleMaximize() {
        return this.makeRequest(BrowserProxyActions.windowHandleMaximize, []);
    }

    public isEnabled(xpath) {
        return this.makeRequest(BrowserProxyActions.isEnabled, [xpath]);
    }

    public scroll(xpath, x, y) {
        return this.makeRequest(BrowserProxyActions.scroll, [xpath, x, y]);
    }

    public alertAccept() {
        return this.makeRequest(BrowserProxyActions.alertAccept, []);
    }

    public alertDismiss() {
        return this.makeRequest(BrowserProxyActions.alertAccept, []);
    }

    public alertText() {
        return this.makeRequest(BrowserProxyActions.alertText, []);
    }

    public dragAndDrop(xpathSource, xpathDestination) {
        return this.makeRequest(BrowserProxyActions.dragAndDrop, [xpathSource, xpathDestination]);
    }

    public addCommand(str, fn) {
        return this.makeRequest(BrowserProxyActions.addCommand, [str, fn]);
    }

    public toFrame(name) {
        return this.makeRequest(BrowserProxyActions.toFrame, [name]);
    }

    public getCookie(cookieName) {
        return this.makeRequest(BrowserProxyActions.getCookie, [cookieName]);
    }

    public deleteCookie(cookieName) {
        return this.makeRequest(BrowserProxyActions.deleteCookie, [cookieName]);
    }

    public getHTML(xpath, b) {
        return this.makeRequest(BrowserProxyActions.getHTML, [xpath, b]);
    }

    public getCurrentTabId() {
        return this.makeRequest(BrowserProxyActions.getCurrentTabId, []);
    }

    public switchTab(tabId) {
        return this.makeRequest(BrowserProxyActions.switchTab, [tabId]);
    }

    public close(tabId) {
        return this.makeRequest(BrowserProxyActions.close, [tabId]);
    }

    public getTabIds() {
        return this.makeRequest(BrowserProxyActions.getTabIds, []);
    }

    public window(fn) {
        return this.makeRequest(BrowserProxyActions.window, [fn]);
    }

    public windowHandles() {
        return this.makeRequest(BrowserProxyActions.windowHandles, []);
    }

    public toParent() {
        return this.makeRequest(BrowserProxyActions.toParent, []);
    }

    public getTagName(xpath) {
        return this.makeRequest(BrowserProxyActions.getTagName, [xpath]).toString();
    }

    public isSelected(xpath) {
        return this.makeRequest(BrowserProxyActions.isSelected, [xpath]);
    }

    public getText(xpath) {
        return this.makeRequest(BrowserProxyActions.getText, [xpath]);
    }

    public elementIdSelected(id) {
        return this.makeRequest(BrowserProxyActions.elementIdSelected, [id]);
    }

    public makeScreenshot() {
        return this.makeRequest(BrowserProxyActions.makeScreenshot, []);
    }

    public uploadFile(path) {
        return this.makeRequest(BrowserProxyActions.uploadFile, [path]);
    }
}
