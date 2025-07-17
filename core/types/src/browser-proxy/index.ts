import {IBrowserProxyCommand} from './structs';
import {WindowFeaturesConfig} from '../web-application';

export interface IBrowserProxyController {
    init(): Promise<void>;

    execute(applicant: string, command: IBrowserProxyCommand): Promise<any>;

    kill(): Promise<void>;
}

export interface IBrowserProxyWorker {
    spawn(): Promise<void>;

    execute(applicant: string, command: IBrowserProxyCommand): Promise<any>;

    kill(): Promise<void>;
}

export interface IBrowserProxyPlugin {
    kill(): void;

    end(applicant: string): Promise<any>;

    refresh(applicant: string): Promise<any>;

    click(applicant: string, selector: string, options?: any): Promise<any>;

    url(applicant: string, val: string): Promise<any>;

    newWindow(
        applicant: string,
        val: string,
        windowName: string,
        windowFeatures: WindowFeaturesConfig,
    ): Promise<any>;

    waitForExist(
        applicant: string,
        xpath: string,
        timeout: number,
    ): Promise<any>;

    waitForVisible(
        applicant: string,
        xpath: string,
        timeout: number,
    ): Promise<any>;

    isVisible(applicant: string, xpath: string): Promise<any>;

    moveToObject(
        applicant: string,
        xpath: string,
        x: number,
        y: number,
    ): Promise<any>;

    execute(applicant: string, fn: any, args: Array<any>): Promise<any>;

    executeAsync(applicant: string, fn: any, args: Array<any>): Promise<any>;

    frame(applicant: string, frameID: any): Promise<any>;

    frameParent(applicant: string): Promise<any>;

    getTitle(applicant: string): Promise<any>;

    clearValue(applicant: string, xpath: string): Promise<any>;

    keys(applicant: string, value: any): Promise<any>;

    elementIdText(applicant: string, elementId: string): Promise<any>;

    elements(applicant: string, xpath: string): Promise<any>;

    getValue(applicant: string, xpath: string): Promise<any>;

    setValue(applicant: string, xpath: string, value: any): Promise<any>;

    selectByIndex(applicant: string, xpath: string, value: any): Promise<any>;

    selectByValue(applicant: string, xpath: string, value: any): Promise<any>;

    selectByVisibleText(
        applicant: string,
        xpath: string,
        str: string,
    ): Promise<any>;

    getAttribute(applicant: string, xpath: string, attr: any): Promise<any>;

    windowHandleMaximize(applicant: string): Promise<any>;

    isEnabled(applicant: string, xpath: string): Promise<any>;

    scroll(
        applicant: string,
        xpath: string,
        x: number,
        y: number,
    ): Promise<any>;

    scrollIntoView(
        applicant: string,
        xpath: string,
        scrollIntoViewOptions?: boolean,
    ): Promise<any>;

    isAlertOpen(applicant: string): Promise<any>;

    alertAccept(applicant: string): Promise<any>;

    alertDismiss(applicant: string): Promise<any>;

    alertText(applicant: string): Promise<any>;

    dragAndDrop(
        applicant: string,
        xpathSource: string,
        xpathDestination: string,
    ): Promise<any>;

    setCookie(applicant: string, cookieName: any): Promise<any>;

    getCookie(applicant: string, cookieName?: string): Promise<any>;

    deleteCookie(applicant: string, cookieName: string): Promise<any>;

    getHTML(applicant: string, xpath: string, b: any): Promise<any>;

    getSize(applicant: string, xpath: string): Promise<any>;

    getCurrentTabId(applicant: string): Promise<any>;

    switchTab(applicant: string, tabId: string): Promise<any>;

    close(applicant: string, tabId: string): Promise<any>;

    getTabIds(applicant: string): Promise<any>;

    window(applicant: string, fn: any): Promise<any>;

    windowHandles(applicant: string): Promise<any>;

    getTagName(applicant: string, xpath: string): Promise<any>;

    isSelected(applicant: string, xpath: string): Promise<any>;

    getText(applicant: string, xpath: string): Promise<any>;

    elementIdSelected(applicant: string, id: string): Promise<any>;

    makeScreenshot(applicant: string): Promise<string | void>;

    uploadFile(applicant: string, filePath: string): Promise<string | void>;

    getCssProperty(
        applicant: string,
        xpath: string,
        cssProperty: string,
    ): Promise<any>;

    getSource(applicant: string): Promise<any>;

    isExisting(applicant: string, xpath: string): Promise<any>;

    waitForValue(
        applicant: string,
        xpath: string,
        timeout: number,
        reverse: boolean,
    ): Promise<any>;

    waitForSelected(
        applicant: string,
        xpath: string,
        timeout: number,
        reverse: boolean,
    ): Promise<any>;

    waitUntil(
        applicant: string,
        condition: () => boolean | Promise<boolean>,
        timeout?: number,
        timeoutMsg?: string,
        interval?: number,
    ): Promise<any>;

    selectByAttribute(
        applicant: string,
        xpath: string,
        attribute: string,
        value: string,
    ): Promise<any>;

    gridTestSession(applicant: string): Promise<any>;

    getHubConfig(applicant: string): Promise<any>;
}
