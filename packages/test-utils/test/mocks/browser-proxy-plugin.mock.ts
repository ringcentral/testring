import * as sinon from 'sinon';
import { IBrowserProxyPlugin } from '@testring/types';

/**
 * Creates a complete mock implementation of IBrowserProxyPlugin
 * with all required methods stubbed using Sinon
 */
export function createBrowserProxyPluginMock(sandbox: sinon.SinonSandbox): sinon.SinonStubbedInstance<IBrowserProxyPlugin> {
    return {
        kill: sandbox.stub().resolves(),
        end: sandbox.stub().resolves(),
        refresh: sandbox.stub().resolves(),
        click: sandbox.stub().resolves(),
        url: sandbox.stub().resolves('https://captive.apple.com'),
        newWindow: sandbox.stub().resolves(),
        waitForExist: sandbox.stub().resolves(),
        waitForVisible: sandbox.stub().resolves(),
        isVisible: sandbox.stub().resolves(true),
        moveToObject: sandbox.stub().resolves(),
        execute: sandbox.stub().resolves(4),
        executeAsync: sandbox.stub().resolves(42),
        frame: sandbox.stub().resolves(),
        frameParent: sandbox.stub().resolves(),
        getTitle: sandbox.stub().resolves('Test Page'),
        clearValue: sandbox.stub().resolves(),
        keys: sandbox.stub().resolves(),
        elementIdText: sandbox.stub().resolves('text'),
        elements: sandbox.stub().resolves([]),
        getValue: sandbox.stub().resolves('value'),
        setValue: sandbox.stub().resolves(),
        selectByIndex: sandbox.stub().resolves(),
        selectByValue: sandbox.stub().resolves(),
        selectByVisibleText: sandbox.stub().resolves(),
        getAttribute: sandbox.stub().resolves('attribute'),
        windowHandleMaximize: sandbox.stub().resolves(),
        isEnabled: sandbox.stub().resolves(true),
        scroll: sandbox.stub().resolves(),
        scrollIntoView: sandbox.stub().resolves(),
        isAlertOpen: sandbox.stub().resolves(false),
        alertAccept: sandbox.stub().resolves(),
        alertDismiss: sandbox.stub().resolves(),
        alertText: sandbox.stub().resolves('alert text'),
        dragAndDrop: sandbox.stub().resolves(),
        setCookie: sandbox.stub().resolves(),
        getCookie: sandbox.stub().resolves({}),
        deleteCookie: sandbox.stub().resolves(),
        getHTML: sandbox.stub().resolves('<html></html>'),
        getSize: sandbox.stub().resolves({ width: 100, height: 100 }),
        getCurrentTabId: sandbox.stub().resolves('tab1'),
        switchTab: sandbox.stub().resolves(),
        close: sandbox.stub().resolves(),
        getTabIds: sandbox.stub().resolves(['tab1']),
        window: sandbox.stub().resolves(),
        windowHandles: sandbox.stub().resolves(['window1']),
        getTagName: sandbox.stub().resolves('div'),
        isSelected: sandbox.stub().resolves(false),
        getText: sandbox.stub().resolves('Test'),
        elementIdSelected: sandbox.stub().resolves(false),
        makeScreenshot: sandbox.stub().resolves('base64screenshot'),
        uploadFile: sandbox.stub().resolves(),
        getCssProperty: sandbox.stub().resolves('red'),
        getSource: sandbox.stub().resolves('<html><body>Test</body></html>'),
        isExisting: sandbox.stub().resolves(true),
        waitForValue: sandbox.stub().resolves(),
        waitForSelected: sandbox.stub().resolves(),
        waitUntil: sandbox.stub().resolves(),
        selectByAttribute: sandbox.stub().resolves(),
        gridTestSession: sandbox.stub().resolves(),
        getHubConfig: sandbox.stub().resolves({})
    } as sinon.SinonStubbedInstance<IBrowserProxyPlugin>;
}

/**
 * Creates a minimal mock that only implements basic methods
 * Useful for testing error scenarios
 */
export function createMinimalBrowserProxyPluginMock(sandbox: sinon.SinonSandbox): Partial<IBrowserProxyPlugin> {
    return {
        kill: sandbox.stub().resolves(),
        end: sandbox.stub().resolves(),
        url: sandbox.stub().resolves('https://captive.apple.com'),
        getTitle: sandbox.stub().resolves('Test Page')
    };
}

/**
 * Creates a mock that throws errors for testing error handling
 */
export function createFailingBrowserProxyPluginMock(sandbox: sinon.SinonSandbox): sinon.SinonStubbedInstance<IBrowserProxyPlugin> {
    const mock = createBrowserProxyPluginMock(sandbox);
    
    // Make some methods fail
    mock.url.rejects(new Error('Navigation failed'));
    mock.click.rejects(new Error('Element not found'));
    mock.execute.rejects(new Error('Script execution failed'));
    
    return mock;
}
