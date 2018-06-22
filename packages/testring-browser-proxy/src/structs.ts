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
    elementIdSelected ='elementIdSelected'

}
