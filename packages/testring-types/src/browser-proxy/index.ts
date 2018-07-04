export enum BrowserProxyMessageTypes {
    execute = 'BrowserProxy/EXEC',
    response = 'BrowserProxy/RESPONSE',
}

export enum BrowserProxyPlugins {
    getPlugin = 'getPlugin'
}

export enum BrowserProxyActions {
    refresh = 'refresh',
    click = 'click',
    execute = 'execute',
    executeAsync = 'executeAsync',
    gridProxyDetails = 'gridProxyDetails',
    url = 'url',
    waitForExist = 'waitForExist',
    waitForVisible = 'waitForVisible',
    isVisible = 'isVisible',
    moveToObject = 'moveToObject',
    getTitle = 'getTitle',
    clearElement = 'clearElement',
    keys = 'keys',
    elementIdText = 'elementIdText',
    elements = 'elements',
    getValue = 'getValue',
    setValue = 'setValue',
    selectByIndex = 'selectByIndex',
    selectByValue = 'selectByValue',
    selectByName = 'selectByName',
    selectByVisibleText = 'selectByVisibleText',
    getAttribute = 'getAttribute',
    windowHandleMaximize = 'windowHandleMaximize',
    isEnabled = 'isEnabled',
    scroll = 'scroll',
    alertAccept = 'alertAccept',
    alertText = 'alertText',
    dragAndDrop = 'dragAndDrop',
    addCommand = 'addCommand',
    toFrame = 'toFrame',
    getCookie = 'getCookie',
    deleteCookie = 'deleteCookie',
    getHTML = 'getHTML',
    getCurrentTabId = 'getCurrentTabId',
    switchTab = 'switchTab',
    close = 'close',
    getTabIds = 'getTabIds',
    window = 'window',
    windowHandles = 'windowHandles',
    toParent = 'toParent',
    getTagName = 'getTagName',
    isSelected = 'isSelected',
    getText = 'getText',
    elementIdSelected = 'elementIdSelected',
    timeoutsAsyncScript = 'timeoutsAsyncScript',
    makeScreenshot = 'makeScreenshot',
    uploadFile = 'uploadFile'
}

export interface IBrowserProxyCommand {
    action: BrowserProxyActions,
    args: Array<string>,
}

export interface IBrowserProxyMessage {
    uid: string,
    command: IBrowserProxyCommand,
}

export interface IBrowserProxyCommandResponse {
    uid: string,
    exception: Error | void,
}

export interface IBrowserProxyPendingCommand {
    resolve: () => void,
    reject: (exception: Error) => void,
    command: IBrowserProxyCommand,
    applicant: string
}

export interface IBrowserProxyController {
    spawn(): Promise<number>;

    execute(applicant: string, command: IBrowserProxyCommand): Promise<void>;

    kill();
}

export interface IBrowserProxyPlugin {
    kill(): void;

    refresh(applicant: string): Promise<any>,

    click(applicant: string, selector: string): Promise<any>,

    gridProxyDetails(applicant: string): Promise<any>,

    url(applicant: string, val: string): Promise<any>,

    waitForExist(applicant: string, xpath: string, timeout: number): Promise<any>,

    waitForVisible(applicant: string, xpath: string, timeout: number): Promise<any>,

    isVisible(applicant: string, xpath: string): Promise<any>,

    moveToObject(applicant: string, xpath: string, x: number, y: number): Promise<any>,

    execute(applicant: string, fn: any, args: Array<any>): Promise<any>,

    executeAsync(applicant: string, fn: any, args: Array<any>): Promise<any>,

    getTitle(applicant: string): Promise<any>,

    clearElement(applicant: string, xpath: string): Promise<any>,

    keys(applicant: string, value: any): Promise<any>,

    elementIdText(applicant: string, elementId: string): Promise<any>,

    elements(applicant: string, xpath: string): Promise<any>,

    getValue(applicant: string, xpath: string): Promise<any>,

    setValue(applicant: string, xpath: string, value: any): Promise<any>,

    selectByIndex(applicant: string, xpath: string, value: any): Promise<any>,

    selectByValue(applicant: string, xpath: string, value: any): Promise<any>,

    selectByVisibleText(applicant: string, xpath: string, str: string): Promise<any>,

    getAttribute(applicant: string, xpath: string, attr: any): Promise<any>,

    windowHandleMaximize(applicant: string): Promise<any>,

    isEnabled(applicant: string, xpath: string): Promise<any>,

    scroll(applicant: string, xpath: string, x: number, y: number): Promise<any>,

    alertAccept(applicant: string): Promise<any>,

    alertDismiss(applicant: string): Promise<any>,

    alertText(applicant: string): Promise<any>,

    dragAndDrop(applicant: string, xpathSource: string, xpathDestination: string): Promise<any>,

    addCommand(applicant: string, str: string, fn: any): Promise<any>,

    getCookie(applicant: string, cookieName: string): Promise<any>,

    deleteCookie(applicant: string, cookieName: string): Promise<any>,

    getHTML(applicant: string, xpath: string, b: any): Promise<any>,

    getCurrentTableId(applicant: string): Promise<any>,

    switchTab(applicant: string, tabId: string): Promise<any>,

    close(applicant: string, tabId: string): Promise<any>,

    getTabIds(applicant: string): Promise<any>,

    window(applicant: string, fn: any): Promise<any>,

    windowHandles(applicant: string): Promise<any>,

    getTagName(applicant: string, xpath: string): Promise<any>,

    isSelected(applicant: string, xpath: string): Promise<any>,

    getText(applicant: string, xpath: string): Promise<any>,

    elementIdSelected(applicant: string, id: string): Promise<any>,

}
