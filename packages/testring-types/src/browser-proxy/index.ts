export enum BrowserProxyMessageTypes {
    execute = 'BrowserProxy/EXEC',
    response = 'BrowserProxy/RESPONSE',
}

export enum BrowserProxyPlugins {
    onAction = 'BrowserProxy/ON_ACTION',
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
