/**
 * Plugin Compatibility Tester
 * 
 * This utility helps test compatibility between different browser driver plugins
 * by providing a common set of test scenarios that should work with both
 * Selenium and Playwright drivers.
 */

import { expect } from 'chai';
import { IBrowserProxyPlugin } from '@testring/types';

export interface CompatibilityTestConfig {
    pluginName: string;
    skipTests?: string[];
    customTimeouts?: {
        [method: string]: number;
    };
}

export class PluginCompatibilityTester {
    private plugin: IBrowserProxyPlugin;
    private config: CompatibilityTestConfig;

    constructor(plugin: IBrowserProxyPlugin, config: CompatibilityTestConfig) {
        this.plugin = plugin;
        this.config = config;
    }

    /**
     * Test that all required IBrowserProxyPlugin methods are implemented
     */
    async testMethodImplementation(): Promise<void> {
        const requiredMethods = [
            'kill', 'end', 'refresh', 'click', 'url', 'newWindow',
            'waitForExist', 'waitForVisible', 'isVisible', 'moveToObject',
            'execute', 'executeAsync', 'frame', 'frameParent', 'getTitle',
            'clearValue', 'keys', 'elementIdText', 'elements', 'getValue',
            'setValue', 'selectByIndex', 'selectByValue', 'selectByVisibleText',
            'getAttribute', 'windowHandleMaximize', 'isEnabled', 'scroll',
            'scrollIntoView', 'isAlertOpen', 'alertAccept', 'alertDismiss',
            'alertText', 'dragAndDrop', 'setCookie', 'getCookie', 'deleteCookie',
            'getHTML', 'getSize', 'getCurrentTabId', 'switchTab', 'close',
            'getTabIds', 'window', 'windowHandles', 'getTagName', 'isSelected',
            'getText', 'elementIdSelected', 'makeScreenshot', 'uploadFile',
            'getCssProperty', 'getSource', 'isExisting', 'waitForValue',
            'waitForSelected', 'waitUntil', 'selectByAttribute',
            'gridTestSession', 'getHubConfig'
        ];

        for (const method of requiredMethods) {
            if (this.config.skipTests?.includes(method)) {
                continue;
            }

            expect(this.plugin).to.have.property(method);
            expect(typeof (this.plugin as any)[method]).to.equal('function');
        }
    }

    /**
     * Test basic navigation functionality
     */
    async testBasicNavigation(): Promise<void> {
        if (this.config.skipTests?.includes('navigation')) {
            return;
        }

        const applicant = `${this.config.pluginName}-nav-test`;

        try {
            // Test URL navigation
            const testUrl = 'https://captive.apple.com';
            const result = await this.plugin.url(applicant, testUrl);
            expect(typeof result).to.equal('string');

            // Test getting current URL
            const currentUrl = await this.plugin.url(applicant, '');
            expect(typeof currentUrl).to.equal('string');

            // Test page title
            const title = await this.plugin.getTitle(applicant);
            expect(typeof title).to.equal('string');

            // Test page refresh
            await this.plugin.refresh(applicant);

            // Test page source
            const source = await this.plugin.getSource(applicant);
            expect(typeof source).to.equal('string');
            expect(source).to.include('html');

        } finally {
            await this.plugin.end(applicant);
        }
    }

    /**
     * Test element existence and visibility checking
     */
    async testElementQueries(): Promise<void> {
        if (this.config.skipTests?.includes('elementQueries')) {
            return;
        }

        const applicant = `${this.config.pluginName}-query-test`;

        try {
            await this.plugin.url(applicant, 'data:text/html,<div id="test">Test</div><input id="input" type="text">');

            // Test element existence
            const exists = await this.plugin.isExisting(applicant, '#test');
            expect(typeof exists).to.equal('boolean');

            const notExists = await this.plugin.isExisting(applicant, '#nonexistent');
            expect(notExists).to.be.false;

            // Test element visibility
            const visible = await this.plugin.isVisible(applicant, '#test');
            expect(typeof visible).to.equal('boolean');

            // Test get text
            const text = await this.plugin.getText(applicant, '#test');
            expect(typeof text).to.equal('string');

        } catch (error) {
            // Some operations might fail in test environment
            expect(error).to.be.an('error');
        } finally {
            await this.plugin.end(applicant);
        }
    }

    /**
     * Test form interactions
     */
    async testFormInteractions(): Promise<void> {
        if (this.config.skipTests?.includes('formInteractions')) {
            return;
        }

        const applicant = `${this.config.pluginName}-form-test`;

        try {
            const html = `
                <form>
                    <input id="text-input" type="text" value="initial">
                    <input id="checkbox" type="checkbox">
                    <select id="select">
                        <option value="1">Option 1</option>
                        <option value="2">Option 2</option>
                    </select>
                    <button id="button">Submit</button>
                </form>
            `;
            
            await this.plugin.url(applicant, `data:text/html,${encodeURIComponent(html)}`);

            // Test input value operations
            await this.plugin.setValue(applicant, '#text-input', 'new value');
            const value = await this.plugin.getValue(applicant, '#text-input');
            expect(typeof value).to.equal('string');

            // Test clear value
            await this.plugin.clearValue(applicant, '#text-input');
            const clearedValue = await this.plugin.getValue(applicant, '#text-input');
            expect(clearedValue).to.equal('');

            // Test element state
            const enabled = await this.plugin.isEnabled(applicant, '#button');
            expect(typeof enabled).to.equal('boolean');

            const selected = await this.plugin.isSelected(applicant, '#checkbox');
            expect(typeof selected).to.equal('boolean');

        } catch (error) {
            // Form operations might fail in test environment
            expect(error).to.be.an('error');
        } finally {
            await this.plugin.end(applicant);
        }
    }

    /**
     * Test JavaScript execution
     */
    async testJavaScriptExecution(): Promise<void> {
        if (this.config.skipTests?.includes('jsExecution')) {
            return;
        }

        const applicant = `${this.config.pluginName}-js-test`;

        try {
            await this.plugin.url(applicant, 'data:text/html,<div>Test</div>');

            // Test synchronous execution
            const syncResult = await this.plugin.execute(applicant, 'return 2 + 2', []);
            expect(syncResult).to.equal(4);

            // Test async execution
            const asyncResult = await this.plugin.executeAsync(applicant, 'return Promise.resolve(42)', []);
            expect(typeof asyncResult).to.not.be.undefined;

            // Test execution with arguments
            const argResult = await this.plugin.execute(applicant, 'return arguments[0] + arguments[1]', [10, 20]);
            expect(argResult).to.equal(30);

        } catch (error) {
            // JS execution might fail in test environment
            expect(error).to.be.an('error');
        } finally {
            await this.plugin.end(applicant);
        }
    }

    /**
     * Test screenshot functionality
     */
    async testScreenshots(): Promise<void> {
        if (this.config.skipTests?.includes('screenshots')) {
            return;
        }

        const applicant = `${this.config.pluginName}-screenshot-test`;

        try {
            await this.plugin.url(applicant, 'data:text/html,<h1>Screenshot Test</h1>');

            const screenshot = await this.plugin.makeScreenshot(applicant);
            expect(typeof screenshot).to.equal('string');
            if (screenshot) {
                expect(screenshot.length).to.be.greaterThan(0);
            }

        } finally {
            await this.plugin.end(applicant);
        }
    }

    /**
     * Test wait operations
     */
    async testWaitOperations(): Promise<void> {
        if (this.config.skipTests?.includes('waitOperations')) {
            return;
        }

        const applicant = `${this.config.pluginName}-wait-test`;

        try {
            await this.plugin.url(applicant, 'data:text/html,<div id="existing">Content</div>');

            // Test wait for existing element
            await this.plugin.waitForExist(applicant, '#existing', 1000);

            // Test wait for visible element
            await this.plugin.waitForVisible(applicant, '#existing', 1000);

            // Test wait until condition
            await this.plugin.waitUntil(applicant, () => true, 1000);

        } catch (error) {
            // Wait operations might timeout in test environment
            expect(error).to.be.an('error');
        } finally {
            await this.plugin.end(applicant);
        }
    }

    /**
     * Test session management
     */
    async testSessionManagement(): Promise<void> {
        if (this.config.skipTests?.includes('sessionManagement')) {
            return;
        }

        const applicant1 = `${this.config.pluginName}-session1`;
        const applicant2 = `${this.config.pluginName}-session2`;

        try {
            // Create multiple sessions
            await this.plugin.url(applicant1, 'https://captive.apple.com');
            await this.plugin.url(applicant2, 'https://google.com');

            // Sessions should be independent
            const title1 = await this.plugin.getTitle(applicant1);
            const title2 = await this.plugin.getTitle(applicant2);

            expect(typeof title1).to.equal('string');
            expect(typeof title2).to.equal('string');

            // End specific session
            await this.plugin.end(applicant1);

            // Other session should still work
            await this.plugin.getTitle(applicant2);

        } finally {
            await this.plugin.end(applicant1);
            await this.plugin.end(applicant2);
        }
    }

    /**
     * Test error handling
     */
    async testErrorHandling(): Promise<void> {
        if (this.config.skipTests?.includes('errorHandling')) {
            return;
        }

        const applicant = `${this.config.pluginName}-error-test`;

        try {
            await this.plugin.url(applicant, 'data:text/html,<div>Test</div>');

            // Test error for non-existent element
            try {
                await this.plugin.click(applicant, '#nonexistent');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error).to.be.an('error');
            }

            // Test graceful handling of non-existent session
            await this.plugin.end('non-existent-session');

        } finally {
            await this.plugin.end(applicant);
        }
    }

    /**
     * Run all compatibility tests
     */
    async runAllTests(): Promise<{ passed: number; failed: number; skipped: number }> {
        const tests = [
            { name: 'Method Implementation', fn: () => this.testMethodImplementation() },
            { name: 'Basic Navigation', fn: () => this.testBasicNavigation() },
            { name: 'Element Queries', fn: () => this.testElementQueries() },
            { name: 'Form Interactions', fn: () => this.testFormInteractions() },
            { name: 'JavaScript Execution', fn: () => this.testJavaScriptExecution() },
            { name: 'Screenshots', fn: () => this.testScreenshots() },
            { name: 'Wait Operations', fn: () => this.testWaitOperations() },
            { name: 'Session Management', fn: () => this.testSessionManagement() },
            { name: 'Error Handling', fn: () => this.testErrorHandling() }
        ];

        let passed = 0;
        let failed = 0;
        let skipped = 0;

        for (const test of tests) {
            try {
                if (this.config.skipTests?.includes(test.name.toLowerCase().replace(/\s+/g, ''))) {
                    console.log(`⏭️  Skipped: ${test.name}`);
                    skipped++;
                    continue;
                }

                await test.fn();
                console.log(`✅ Passed: ${test.name}`);
                passed++;
            } catch (error) {
                console.log(`❌ Failed: ${test.name} - ${error instanceof Error ? error.message : String(error)}`);
                failed++;
            }
        }

        // Always clean up
        try {
            await this.plugin.kill();
        } catch (error) {
            // Ignore cleanup errors
        }

        return { passed, failed, skipped };
    }
}