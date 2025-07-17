import {
    BrowserProxyActions,
    ITransport,
    IWebApplicationClient,
    IWebApplicationExecuteMessage,
    IWebApplicationResponseMessage,
    SavePdfOptions,
    WebApplicationMessageType,
    WindowFeaturesConfig,
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

    public click(xpath: string, options?: any) {
        return this.makeRequest(BrowserProxyActions.click, [xpath, options]);
    }

    public getSize(xpath: string) {
        return this.makeRequest(BrowserProxyActions.getSize, [xpath]);
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

    public waitForExist(xpath: string, timeout: number) {
        return this.makeRequest(BrowserProxyActions.waitForExist, [
            xpath,
            timeout,
        ]);
    }

    public waitForVisible(xpath: string, timeout: number) {
        return this.makeRequest(BrowserProxyActions.waitForVisible, [
            xpath,
            timeout,
        ]);
    }

    public isVisible(xpath: string) {
        return this.makeRequest(BrowserProxyActions.isVisible, [xpath]);
    }

    public moveToObject(xpath: string, x: number, y: number) {
        return this.makeRequest(BrowserProxyActions.moveToObject, [
            xpath,
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

    public clearValue(xpath: string) {
        return this.makeRequest(BrowserProxyActions.clearValue, [xpath]);
    }

    public keys(value: any) {
        return this.makeRequest(BrowserProxyActions.keys, [value]);
    }

    public elementIdText(elementId: string) {
        return this.makeRequest(BrowserProxyActions.elementIdText, [elementId]);
    }

    public elements(xpath: string) {
        return this.makeRequest(BrowserProxyActions.elements, [xpath]);
    }

    public getValue(xpath: string) {
        return this.makeRequest(BrowserProxyActions.getValue, [xpath]);
    }

    public setValue(xpath: string, value: any) {
        return this.makeRequest(BrowserProxyActions.setValue, [xpath, value]);
    }

    public keysOnElement(xpath: string, value: any) {
        return this.makeRequest(BrowserProxyActions.keysOnElement, [
            xpath,
            value,
        ]);
    }

    public selectByIndex(xpath: string, value: any) {
        return this.makeRequest(BrowserProxyActions.selectByIndex, [
            xpath,
            value,
        ]);
    }

    public selectByValue(xpath: string, value: any) {
        return this.makeRequest(BrowserProxyActions.selectByValue, [
            xpath,
            value,
        ]);
    }

    public selectByVisibleText(xpath: string, str: any) {
        return this.makeRequest(BrowserProxyActions.selectByVisibleText, [
            xpath,
            str,
        ]);
    }

    public getAttribute(xpath: string, attr: string) {
        return this.makeRequest(BrowserProxyActions.getAttribute, [
            xpath,
            attr,
        ]);
    }

    public windowHandleMaximize() {
        return this.makeRequest(BrowserProxyActions.windowHandleMaximize, []);
    }

    public isEnabled(xpath: string) {
        return this.makeRequest(BrowserProxyActions.isEnabled, [xpath]);
    }

    public scroll(xpath: string, x: number, y: number) {
        return this.makeRequest(BrowserProxyActions.scroll, [xpath, x, y]);
    }

    public scrollIntoView(xpath: string, scrollIntoViewOptions?: boolean) {
        return this.makeRequest(BrowserProxyActions.scrollIntoView, [
            xpath,
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

    public dragAndDrop(xpathSource: string, xpathDestination: string) {
        return this.makeRequest(BrowserProxyActions.dragAndDrop, [
            xpathSource,
            xpathDestination,
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

    public getCookie(cookieName?: string) {
        return this.makeRequest(BrowserProxyActions.getCookie, [cookieName]);
    }

    public deleteCookie(cookieName: string) {
        return this.makeRequest(BrowserProxyActions.deleteCookie, [cookieName]);
    }

    public getHTML(xpath: string, b: any) {
        return this.makeRequest(BrowserProxyActions.getHTML, [xpath, b]);
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

    public getTagName(xpath: string) {
        return this.makeRequest(BrowserProxyActions.getTagName, [xpath]);
    }

    public isSelected(xpath: string) {
        return this.makeRequest(BrowserProxyActions.isSelected, [xpath]);
    }

    public getText(xpath: string) {
        return this.makeRequest(BrowserProxyActions.getText, [xpath]);
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

    public getCssProperty(xpath: string, cssProperty: string) {
        return this.makeRequest(BrowserProxyActions.getCssProperty, [
            xpath,
            cssProperty,
        ]);
    }

    public getSource() {
        return this.makeRequest(BrowserProxyActions.getSource, []);
    }

    public isExisting(xpath: string) {
        return this.makeRequest(BrowserProxyActions.isExisting, [xpath]);
    }

    public waitForValue(xpath: string, timeout: number, reverse: boolean) {
        return this.makeRequest(BrowserProxyActions.waitForValue, [
            xpath,
            timeout,
            reverse,
        ]);
    }

    public waitForSelected(xpath: string, timeout: number, reverse: boolean) {
        return this.makeRequest(BrowserProxyActions.waitForSelected, [
            xpath,
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

    public selectByAttribute(xpath: string, attribute: string, value: any) {
        return this.makeRequest(BrowserProxyActions.selectByAttribute, [
            xpath,
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

    public getLocation(xpath: string) {
        return this.makeRequest(BrowserProxyActions.getLocation, [xpath]);
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

    public addValue(xpath: string, value: string | number) {
        return this.makeRequest(BrowserProxyActions.addValue, [xpath, value]);
    }

    public doubleClick(xpath: string) {
        return this.makeRequest(BrowserProxyActions.doubleClick, [xpath]);
    }

    public isClickable(xpath: string) {
        return this.makeRequest(BrowserProxyActions.isClickable, [xpath]);
    }

    public waitForClickable(xpath: string, timeout: number) {
        return this.makeRequest(BrowserProxyActions.waitForClickable, [
            xpath,
            timeout,
        ]);
    }

    public isFocused(xpath: string) {
        return this.makeRequest(BrowserProxyActions.isFocused, [xpath]);
    }

    public isStable(xpath: string) {
        return this.makeRequest(BrowserProxyActions.isStable, [xpath]);
    }

    public waitForEnabled(xpath: string, timeout: number) {
        return this.makeRequest(BrowserProxyActions.waitForEnabled, [
            xpath,
            timeout,
        ]);
    }

    public waitForStable(xpath: string, timeout: number) {
        return this.makeRequest(BrowserProxyActions.waitForStable, [
            xpath,
            timeout,
        ]);
    }
}
