import {IBrowserProxyCommand} from './structs';
import {WindowFeaturesConfig} from '../web-application';

export type XpathSelector = {
    type: 'xpath';
    xpath: string;
};

export type ShadowCssSelector = {
    type: 'shadow-css';
    css: string;
    parentSelectors: string[];
    isShadowElement: true;
};

export type Selector =
    | XpathSelector
    | ShadowCssSelector;

export const isXpathSelector = (selector: Selector): selector is XpathSelector =>
    selector.type === 'xpath';

export const isShadowCssSelector = (selector: Selector): selector is ShadowCssSelector =>
    selector.type === 'shadow-css';

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

    click(applicant: string, selector: Selector, options?: any): Promise<any>;

    url(applicant: string, val: string): Promise<any>;

    newWindow(
        applicant: string,
        val: string,
        windowName: string,
        windowFeatures: WindowFeaturesConfig,
    ): Promise<any>;

    waitForExist(
        applicant: string,
        selector: Selector,
        timeout: number,
    ): Promise<any>;

    waitForVisible(
        applicant: string,
        selector: Selector,
        timeout: number,
    ): Promise<any>;

    isVisible(applicant: string, selector: Selector): Promise<any>;

    moveToObject(
        applicant: string,
        selector: Selector,
        x: number,
        y: number,
    ): Promise<any>;

    execute(applicant: string, fn: any, args: Array<any>): Promise<any>;

    executeAsync(applicant: string, fn: any, args: Array<any>): Promise<any>;

    frame(applicant: string, frameID: any): Promise<any>;

    frameParent(applicant: string): Promise<any>;

    getTitle(applicant: string): Promise<any>;

    clearValue(applicant: string, selector: Selector): Promise<any>;

    keys(applicant: string, value: any): Promise<any>;

    elementIdText(applicant: string, elementId: string): Promise<any>;

    elements(applicant: string, selector: Selector): Promise<any>;

    getValue(applicant: string, selector: Selector): Promise<any>;

    setValue(applicant: string, selector: Selector, value: any): Promise<any>;

    selectByIndex(applicant: string, selector: Selector, value: any): Promise<any>;

    selectByValue(applicant: string, selector: Selector, value: any): Promise<any>;

    selectByVisibleText(
        applicant: string,
        selector: Selector,
        str: string,
    ): Promise<any>;

    getAttribute(applicant: string, selector: Selector, attr: any): Promise<any>;

    windowHandleMaximize(applicant: string): Promise<any>;

    isEnabled(applicant: string, selector: Selector): Promise<any>;

    scroll(
        applicant: string,
        selector: Selector,
        x: number,
        y: number,
    ): Promise<any>;

    scrollIntoView(
        applicant: string,
        selector: Selector,
        scrollIntoViewOptions?: boolean,
    ): Promise<any>;

    isAlertOpen(applicant: string): Promise<any>;

    alertAccept(applicant: string): Promise<any>;

    alertDismiss(applicant: string): Promise<any>;

    alertText(applicant: string): Promise<any>;

    dragAndDrop(
        applicant: string,
        sourceSelector: Selector,
        destinationSelector: Selector,
    ): Promise<any>;

    setCookie(applicant: string, cookieName: any): Promise<any>;

    getCookie(applicant: string, cookieName: string): Promise<any>;

    deleteCookie(applicant: string, cookieName: string): Promise<any>;

    getHTML(applicant: string, selector: Selector, b: any): Promise<any>;

    getSize(applicant: string, selector: Selector): Promise<any>;

    getCurrentTabId(applicant: string): Promise<any>;

    switchTab(applicant: string, tabId: string): Promise<any>;

    close(applicant: string, tabId: string): Promise<any>;

    getTabIds(applicant: string): Promise<any>;

    window(applicant: string, fn: any): Promise<any>;

    windowHandles(applicant: string): Promise<any>;

    getTagName(applicant: string, selector: Selector): Promise<any>;

    isSelected(applicant: string, selector: Selector): Promise<any>;

    getText(applicant: string, selector: Selector): Promise<any>;

    elementIdSelected(applicant: string, id: string): Promise<any>;

    makeScreenshot(applicant: string): Promise<string | void>;

    makeElementScreenshot(applicant: string, selector: Selector, scroll?: boolean): Promise<string | void>;

    uploadFile(applicant: string, filePath: string): Promise<string | void>;

    getCssProperty(
        applicant: string,
        selector: Selector,
        cssProperty: string,
    ): Promise<any>;

    getSource(applicant: string): Promise<any>;

    isExisting(applicant: string, selector: Selector): Promise<any>;

    waitForValue(
        applicant: string,
        selector: Selector,
        timeout: number,
        reverse: boolean,
    ): Promise<any>;

    waitForSelected(
        applicant: string,
        selector: Selector,
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
        selector: Selector,
        attribute: string,
        value: string,
    ): Promise<any>;

    gridTestSession(applicant: string): Promise<any>;

    getHubConfig(applicant: string): Promise<any>;
}
