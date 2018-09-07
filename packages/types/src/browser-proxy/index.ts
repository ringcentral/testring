import { IBrowserProxyCommand } from './structs';

export interface IBrowserProxyController {
    spawn(): Promise<number>;

    execute(applicant: string, command: IBrowserProxyCommand): Promise<void>;

    kill(): Promise<void>;
}

export interface IBrowserProxyPlugin {
    kill(): void;

    end(applicant: string): Promise<any>;

    refresh(applicant: string): Promise<any>;

    click(applicant: string, selector: string): Promise<any>;

    gridProxyDetails(applicant: string): Promise<any>;

    url(applicant: string, val: string): Promise<any>;

    waitForExist(applicant: string, xpath: string, timeout: number): Promise<any>;

    waitForVisible(applicant: string, xpath: string, timeout: number): Promise<any>;

    isVisible(applicant: string, xpath: string): Promise<any>;

    moveToObject(applicant: string, xpath: string, x: number, y: number): Promise<any>;

    execute(applicant: string, fn: any, args: Array<any>): Promise<any>;

    executeAsync(applicant: string, fn: any, args: Array<any>): Promise<any>;

    frame(applicant: string, frameID: any): Promise<any>;

    parentFrame(applicant: string): Promise<any>;

    getTitle(applicant: string): Promise<any>;

    clearElement(applicant: string, xpath: string): Promise<any>;

    keys(applicant: string, value: any): Promise<any>;

    elementIdText(applicant: string, elementId: string): Promise<any>;

    elements(applicant: string, xpath: string): Promise<any>;

    getValue(applicant: string, xpath: string): Promise<any>;

    setValue(applicant: string, xpath: string, value: any): Promise<any>;

    selectByIndex(applicant: string, xpath: string, value: any): Promise<any>;

    selectByValue(applicant: string, xpath: string, value: any): Promise<any>;

    selectByVisibleText(applicant: string, xpath: string, str: string): Promise<any>;

    getAttribute(applicant: string, xpath: string, attr: any): Promise<any>;

    windowHandleMaximize(applicant: string): Promise<any>;

    isEnabled(applicant: string, xpath: string): Promise<any>;

    scroll(applicant: string, xpath: string, x: number, y: number): Promise<any>;

    alertAccept(applicant: string): Promise<any>;

    alertDismiss(applicant: string): Promise<any>;

    alertText(applicant: string): Promise<any>;

    dragAndDrop(applicant: string, xpathSource: string, xpathDestination: string): Promise<any>;

    addCommand(applicant: string, str: string, fn: any): Promise<any>;

    getCookie(applicant: string, cookieName: string): Promise<any>;

    deleteCookie(applicant: string, cookieName: string): Promise<any>;

    getHTML(applicant: string, xpath: string, b: any): Promise<any>;

    getCurrentTableId(applicant: string): Promise<any>;

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
}
