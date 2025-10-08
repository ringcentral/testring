import {
    BrowserProxyActions,
    ITransport,
    IWebApplicationClient,
    IWebApplicationExecuteMessage,
    IWebApplicationResponseMessage,
    SavePdfOptions,
    WebApplicationMessageType,
    WindowFeaturesConfig,
    Selector,
} from '@testring/types';
import {generateUniqId} from '@testring/utils';

export class WebClient implements IWebApplicationClient {
    constructor(private applicant: string, private transport: ITransport) {}

    private makeRequest(
        action: BrowserProxyActions,
        args: Array<any> = [],
    ): Promise<any> {
        const error = new Error();
        const transport = this.transport;

        return new Promise((resolve, reject) => {
            const uid = generateUniqId();
            const request: IWebApplicationExecuteMessage = {
                uid,
                applicant: this.applicant,
                command: {
                    action,
                    args,
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
                },
            );

            transport.broadcastUniversally(
                WebApplicationMessageType.execute,
                request,
            );
        });
    }

    public end() {
        return this.makeRequest(BrowserProxyActions.end, []);
    }

    public refresh() {
        return this.makeRequest(BrowserProxyActions.refresh, []);
    }

    public setCustomBrowserClientConfig(config: any) {
        return this.makeRequest(BrowserProxyActions.setCustomBrowserClientConfig, [config]);
    }

    public getCustomBrowserClientConfig() {
        return this.makeRequest(BrowserProxyActions.getCustomBrowserClientConfig, []);
    }

    public getHubConfig() {
        return this.makeRequest(BrowserProxyActions.getHubConfig, []);
    }

    public click(selector: Selector, options?: any) {
        return this.makeRequest(BrowserProxyActions.click, [selector, options]);
    }

    public getSize(selector: Selector) {
        return this.makeRequest(BrowserProxyActions.getSize, [selector]);
    }

    public url(val: any) {
        return this.makeRequest(BrowserProxyActions.url, [val]);
    }

    public newWindow(
        url: string,
        windowName: string,
        windowFeatures: WindowFeaturesConfig,
    ) {
        return this.makeRequest(BrowserProxyActions.newWindow, [
            url,
            windowName,
            windowFeatures,
        ]);
    }

    public waitForExist(selector: Selector, timeout: number) {
        return this.makeRequest(BrowserProxyActions.waitForExist, [
            selector,
            timeout,
        ]);
    }

    public waitForVisible(selector: Selector, timeout: number) {
        return this.makeRequest(BrowserProxyActions.waitForVisible, [
            selector,
            timeout,
        ]);
    }

    public isVisible(selector: Selector) {
        return this.makeRequest(BrowserProxyActions.isVisible, [selector]);
    }

    public moveToObject(selector: Selector, x: number, y: number) {
        return this.makeRequest(BrowserProxyActions.moveToObject, [
            selector,
            x,
            y,
        ]);
    }

    public execute(fn: any, ...args: any[]) {
        return this.makeRequest(BrowserProxyActions.execute, [fn, args]);
    }

    public executeAsync(fn: any, ...args: any[]) {
        return this.makeRequest(BrowserProxyActions.executeAsync, [fn, args]);
    }

    public getTitle() {
        return this.makeRequest(BrowserProxyActions.getTitle, []);
    }

    public clearValue(selector: Selector) {
        return this.makeRequest(BrowserProxyActions.clearValue, [selector]);
    }

    public keys(value: any) {
        return this.makeRequest(BrowserProxyActions.keys, [value]);
    }

    public elementIdText(elementId: string) {
        return this.makeRequest(BrowserProxyActions.elementIdText, [elementId]);
    }

    public elements(selector: Selector) {
        return this.makeRequest(BrowserProxyActions.elements, [selector]);
    }

    public getValue(selector: Selector) {
        return this.makeRequest(BrowserProxyActions.getValue, [selector]);
    }

    public setValue(selector: Selector, value: any) {
        return this.makeRequest(BrowserProxyActions.setValue, [selector, value]);
    }

    public keysOnElement(selector: Selector, value: any) {
        return this.makeRequest(BrowserProxyActions.keysOnElement, [
            selector,
            value,
        ]);
    }

    public selectByIndex(selector: Selector, value: any) {
        return this.makeRequest(BrowserProxyActions.selectByIndex, [
            selector,
            value,
        ]);
    }

    public selectByValue(selector: Selector, value: any) {
        return this.makeRequest(BrowserProxyActions.selectByValue, [
            selector,
            value,
        ]);
    }

    public selectByVisibleText(selector: Selector, str: any) {
        return this.makeRequest(BrowserProxyActions.selectByVisibleText, [
            selector,
            str,
        ]);
    }

    public getAttribute(selector: Selector, attr: string) {
        return this.makeRequest(BrowserProxyActions.getAttribute, [
            selector,
            attr,
        ]);
    }

    public windowHandleMaximize() {
        return this.makeRequest(BrowserProxyActions.windowHandleMaximize, []);
    }

    public isEnabled(selector: Selector) {
        return this.makeRequest(BrowserProxyActions.isEnabled, [selector]);
    }

    public scroll(selector: Selector, x: number, y: number) {
        return this.makeRequest(BrowserProxyActions.scroll, [selector, x, y]);
    }

    public scrollIntoView(selector: Selector, scrollIntoViewOptions?: boolean) {
        return this.makeRequest(BrowserProxyActions.scrollIntoView, [
            selector,
            scrollIntoViewOptions,
        ]);
    }

    public isAlertOpen() {
        return this.makeRequest(BrowserProxyActions.isAlertOpen, []);
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

    public dragAndDrop(sourceSelector: Selector, destinationSelector: Selector) {
        return this.makeRequest(BrowserProxyActions.dragAndDrop, [
            sourceSelector,
            destinationSelector,
        ]);
    }

    public frame(name: string) {
        return this.makeRequest(BrowserProxyActions.frame, [name]);
    }

    public frameParent() {
        return this.makeRequest(BrowserProxyActions.frameParent, []);
    }

    public setCookie(cookieObj: any) {
        return this.makeRequest(BrowserProxyActions.setCookie, [cookieObj]);
    }

    public getCookie(cookieName: string) {
        return this.makeRequest(BrowserProxyActions.getCookie, [cookieName]);
    }

    public deleteCookie(cookieName: string) {
        return this.makeRequest(BrowserProxyActions.deleteCookie, [cookieName]);
    }

    public getHTML(selector: Selector, b: any) {
        return this.makeRequest(BrowserProxyActions.getHTML, [selector, b]);
    }

    public getCurrentTabId() {
        return this.makeRequest(BrowserProxyActions.getCurrentTabId, []);
    }

    public switchTab(tabId: string) {
        return this.makeRequest(BrowserProxyActions.switchTab, [tabId]);
    }

    public close(tabId: string) {
        return this.makeRequest(BrowserProxyActions.close, [tabId]);
    }

    public getTabIds() {
        return this.makeRequest(BrowserProxyActions.getTabIds, []);
    }

    public window(fn: any) {
        return this.makeRequest(BrowserProxyActions.window, [fn]);
    }

    public windowHandles() {
        return this.makeRequest(BrowserProxyActions.windowHandles, []);
    }

    public getTagName(selector: Selector) {
        return this.makeRequest(BrowserProxyActions.getTagName, [selector]);
    }

    public isSelected(selector: Selector) {
        return this.makeRequest(BrowserProxyActions.isSelected, [selector]);
    }

    public getText(selector: Selector) {
        return this.makeRequest(BrowserProxyActions.getText, [selector]);
    }

    public elementIdSelected(id: string) {
        return this.makeRequest(BrowserProxyActions.elementIdSelected, [id]);
    }

    public makeScreenshot() {
        return this.makeRequest(BrowserProxyActions.makeScreenshot, []);
    }

    public uploadFile(path: string) {
        return this.makeRequest(BrowserProxyActions.uploadFile, [path]);
    }

    public kill() {
        return this.makeRequest(BrowserProxyActions.kill);
    }

    public getCssProperty(selector: Selector, cssProperty: string) {
        return this.makeRequest(BrowserProxyActions.getCssProperty, [
            selector,
            cssProperty,
        ]);
    }

    public getSource() {
        return this.makeRequest(BrowserProxyActions.getSource, []);
    }

    public isExisting(selector: Selector) {
        return this.makeRequest(BrowserProxyActions.isExisting, [selector]);
    }

    public waitForValue(selector: Selector, timeout: number, reverse: boolean) {
        return this.makeRequest(BrowserProxyActions.waitForValue, [
            selector,
            timeout,
            reverse,
        ]);
    }

    public waitForSelected(selector: Selector, timeout: number, reverse: boolean) {
        return this.makeRequest(BrowserProxyActions.waitForSelected, [
            selector,
            timeout,
            reverse,
        ]);
    }

    public waitUntil(condition: unknown, timeout: number, timeoutMsg: string, interval: number) {
        return this.makeRequest(BrowserProxyActions.waitUntil, [
            condition,
            timeout,
            timeoutMsg,
            interval,
        ]);
    }

    public selectByAttribute(selector: Selector, attribute: string, value: any) {
        return this.makeRequest(BrowserProxyActions.selectByAttribute, [
            selector,
            attribute,
            value,
        ]);
    }

    public gridTestSession() {
        return this.makeRequest(BrowserProxyActions.gridTestSession, []);
    }

    /**
     *
     * @param url string
     * @param overwrites should NOT be an arrow function, Otherwise it would throw an error
     * @param params [Optional]
     * @param params.filterOptions
     * @param params.mockResponseParams
     * @returns
     */
    public mock(
        url: string,
        overwrites: string | Object | Function,
        params = {
            filterOptions: {},
            mockResponseParams: {},
        },
    ) {
        return this.makeRequest(BrowserProxyActions.mock, [
            url,
            overwrites,
            params.filterOptions || {},
            params.mockResponseParams || {},
        ]);
    }

    public getMockData(url: string) {
        return this.makeRequest(BrowserProxyActions.getMockData, [url]);
    }

    public getCdpCoverageFile() {
        return this.makeRequest(BrowserProxyActions.getCdpCoverageFile, []);
    }

    public emulateDevice(deviceName = 'iPhone X') {
        return this.makeRequest(BrowserProxyActions.emulateDevice, [
            deviceName,
        ]);
    }

    public status() {
        return this.makeRequest(BrowserProxyActions.status, []);
    }

    public back() {
        return this.makeRequest(BrowserProxyActions.back, []);
    }

    public forward() {
        return this.makeRequest(BrowserProxyActions.forward, []);
    }

    public getActiveElement() {
        return this.makeRequest(BrowserProxyActions.getActiveElement, []);
    }

    public getLocation(selector: Selector) {
        return this.makeRequest(BrowserProxyActions.getLocation, [selector]);
    }

    public setTimeZone(timeZone: string) {
        return this.makeRequest(BrowserProxyActions.setTimeZone, [timeZone]);
    }

    public getWindowSize() {
        return this.makeRequest(BrowserProxyActions.getWindowSize, []);
    }

    public savePDF(options: SavePdfOptions) {
        return this.makeRequest(BrowserProxyActions.savePDF, [options]);
    }

    public addValue(selector: Selector, value: string | number) {
        return this.makeRequest(BrowserProxyActions.addValue, [selector, value]);
    }

    public doubleClick(selector: Selector) {
        return this.makeRequest(BrowserProxyActions.doubleClick, [selector]);
    }

    public isClickable(selector: Selector) {
        return this.makeRequest(BrowserProxyActions.isClickable, [selector]);
    }

    public waitForClickable(selector: Selector, timeout: number) {
        return this.makeRequest(BrowserProxyActions.waitForClickable, [
            selector,
            timeout,
        ]);
    }

    public isFocused(selector: Selector) {
        return this.makeRequest(BrowserProxyActions.isFocused, [selector]);
    }

    public isStable(selector: Selector) {
        return this.makeRequest(BrowserProxyActions.isStable, [selector]);
    }

    public waitForEnabled(selector: Selector, timeout: number) {
        return this.makeRequest(BrowserProxyActions.waitForEnabled, [
            selector,
            timeout,
        ]);
    }

    public waitForStable(selector: Selector, timeout: number) {
        return this.makeRequest(BrowserProxyActions.waitForStable, [
            selector,
            timeout,
        ]);
    }
}
