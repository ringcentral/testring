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
}

export interface IBrowserProxyController {
    spawn(): Promise<number>;

    execute(command: IBrowserProxyCommand): Promise<void>;

    kill();
}

export interface IBrowserProxyPlugin {
    refresh(): Promise<any>,

    click(selector: string): Promise<any>,

    gridProxyDetails(): Promise<any>,

    url(val: string): Promise<any>,

    waitForExist(xpath: string, timeout: number): Promise<any>,

    waitForVisible(xpath: string, timeout: number): Promise<any>,

    isVisible(xpath: string): Promise<any>,

    moveToObject(xpath: string, x: number, y: number): Promise<any>,

    execute(fn: any, args: Array<any>): Promise<any>,

    executeAsync(fn: any, args: Array<any>): Promise<any>,

    getTitle(): Promise<any>,

    clearElement(xpath: string): Promise<any>,

    keys(value: any): Promise<any>,

    elementIdText(elementId: string): Promise<any>,

    elements(xpath: string): Promise<any>,

    getValue(xpath: string): Promise<any>,

    setValue(xpath: string, value: any): Promise<any>,

    selectByIndex(xpath: string, value: any): Promise<any>,

    selectByValue(xpath: string, value: any): Promise<any>,

    selectByVisibleText(xpath: string, str: string): Promise<any>,

    getAttribute(xpath: string, attr: any): Promise<any>,

    windowHandleMaximize(): Promise<any>,

    isEnabled(xpath: string): Promise<any>,

    scroll(xpath: string, x: number, y: number): Promise<any>,

    alertAccept(): Promise<any>,

    alertDismiss(): Promise<any>,

    alertText(): Promise<any>,

    dragAndDrop(xpathSource: string, xpathDestination: string): Promise<any>,

    addCommand(str: string, fn: any): Promise<any>,

    getCookie(cookieName: string): Promise<any>,

    deleteCookie(cookieName: string): Promise<any>,

    getHTML(xpath: string, b: any): Promise<any>,

    getCurrentTableId(): Promise<any>,

    switchTab(tabId: string): Promise<any>,

    close(tabId: string): Promise<any>,

    getTabIds(): Promise<any>,

    window(fn: any): Promise<any>,

    windowHandles(): Promise<any>,

    getTagName(xpath: string): Promise<any>,

    isSelected(xpath: string): Promise<any>,

    getText(xpath: string): Promise<any>,

    elementIdSelected(id: string): Promise<any>,

}
