import {
    BrowserProxyActions,
    ITransport,
    IWebApplicationClient,
    IWebApplicationExecuteMessage,
    IWebApplicationResponseMessage,
    WebApplicationMessageType,
    WindowFeaturesConfig,
} from '@testring/types';
import { generateUniqId } from '@testring/utils';

export class WebClient implements IWebApplicationClient {

    constructor(private applicant: string, private transport: ITransport) {
    }

    private makeRequest(action: BrowserProxyActions, args: Array<any> = []): Promise<any> {
        const error = new Error();
        const transport = this.transport;

        return new Promise((resolve, reject) => {
            const uid = generateUniqId();
            const request: IWebApplicationExecuteMessage = {
                uid: uid,
                applicant: this.applicant,
                command: {
                    action: action,
                    args: args,
                },
            };

            const removeListener = transport.on<IWebApplicationResponseMessage>(
                WebApplicationMessageType.response,
                (message) => {
                    if (message.uid === uid) {
                        removeListener();

                        if (message.error) {
                            error.message = message.error.message;

                            reject(error);
                        } else {
                            resolve(message.response);
                        }
                    }
                }
            );

            transport.broadcastUniversally(WebApplicationMessageType.execute, request);
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

    public newWindow(url: string, windowName: string, windowFeatures: WindowFeaturesConfig) {
        return this.makeRequest(BrowserProxyActions.newWindow, [url, windowName, windowFeatures]);
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
        return this.makeRequest(BrowserProxyActions.alertDismiss, []);
    }

    public alertText() {
        return this.makeRequest(BrowserProxyActions.alertText, []);
    }

    public dragAndDrop(xpathSource, xpathDestination) {
        return this.makeRequest(BrowserProxyActions.dragAndDrop, [xpathSource, xpathDestination]);
    }

    public frame(name) {
        return this.makeRequest(BrowserProxyActions.frame, [name]);
    }

    public frameParent() {
        return this.makeRequest(BrowserProxyActions.frameParent, []);
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

    public getTagName(xpath) {
        return this.makeRequest(BrowserProxyActions.getTagName, [xpath]);
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

    public kill() {
        return this.makeRequest(BrowserProxyActions.kill);
    }
}
