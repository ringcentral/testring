/// <reference types="mocha" />

import { expect } from 'chai';
import { PlaywrightPlugin } from '../src/plugin/index';
import { PlaywrightPluginConfig } from '../src/types';

describe('Selenium Grid Integration Tests', () => {
    let plugin: PlaywrightPlugin;
    
    afterEach(async () => {
        if (plugin) {
            await plugin.kill();
        }
        // 清理环境变量
        delete process.env['SELENIUM_REMOTE_URL'];
        delete process.env['SELENIUM_REMOTE_CAPABILITIES'];
        delete process.env['SELENIUM_REMOTE_HEADERS'];
    });

    describe('Configuration Tests', () => {
        it('should detect Selenium Grid when gridUrl is configured', () => {
            const config: PlaywrightPluginConfig = {
                browserName: 'chromium',
                seleniumGrid: {
                    gridUrl: 'http://selenium-hub:4444'
                }
            };
            
            plugin = new PlaywrightPlugin(config);
            
            // 使用私有方法测试（仅用于测试目的）
            const isGridEnabled = (plugin as any).isSeleniumGridEnabled();
            expect(isGridEnabled).to.be.true;
        });

        it('should detect Selenium Grid when environment variable is set', () => {
            process.env['SELENIUM_REMOTE_URL'] = 'http://selenium-hub:4444';
            
            const config: PlaywrightPluginConfig = {
                browserName: 'chromium'
            };
            
            plugin = new PlaywrightPlugin(config);
            
            const isGridEnabled = (plugin as any).isSeleniumGridEnabled();
            expect(isGridEnabled).to.be.true;
        });

        it('should not detect Selenium Grid when not configured', () => {
            const config: PlaywrightPluginConfig = {
                browserName: 'chromium'
            };
            
            plugin = new PlaywrightPlugin(config);
            
            const isGridEnabled = (plugin as any).isSeleniumGridEnabled();
            expect(isGridEnabled).to.be.false;
        });

        it('should set environment variables when Selenium Grid is configured', () => {
            const config: PlaywrightPluginConfig = {
                browserName: 'chromium',
                seleniumGrid: {
                    gridUrl: 'http://selenium-hub:4444',
                    gridCapabilities: {
                        'browserName': 'chrome',
                        'browserVersion': 'latest'
                    },
                    gridHeaders: {
                        'Authorization': 'Bearer token'
                    }
                }
            };
            
            plugin = new PlaywrightPlugin(config);
            
            // 触发设置环境变量
            (plugin as any).setupSeleniumGridEnvironment();
            
            expect(process.env['SELENIUM_REMOTE_URL']).to.equal('http://selenium-hub:4444');
            expect(process.env['SELENIUM_REMOTE_CAPABILITIES']).to.equal(
                JSON.stringify({ 'browserName': 'chrome', 'browserVersion': 'latest' })
            );
            expect(process.env['SELENIUM_REMOTE_HEADERS']).to.equal(
                JSON.stringify({ 'Authorization': 'Bearer token' })
            );
        });

        it('should not override existing environment variables', () => {
            // 预设环境变量
            process.env['SELENIUM_REMOTE_URL'] = 'http://existing-grid:4444';
            process.env['SELENIUM_REMOTE_CAPABILITIES'] = '{"existing": "capability"}';
            
            const config: PlaywrightPluginConfig = {
                browserName: 'chromium',
                seleniumGrid: {
                    gridUrl: 'http://new-grid:4444',
                    gridCapabilities: {
                        'new': 'capability'
                    }
                }
            };
            
            plugin = new PlaywrightPlugin(config);
            (plugin as any).setupSeleniumGridEnvironment();
            
            // 应该保持原有的环境变量
            expect(process.env['SELENIUM_REMOTE_URL']).to.equal('http://existing-grid:4444');
            expect(process.env['SELENIUM_REMOTE_CAPABILITIES']).to.equal('{"existing": "capability"}');
        });
    });

    describe('Browser Support Tests', () => {
        it('should support chromium browser with Selenium Grid', async () => {
            const config: PlaywrightPluginConfig = {
                browserName: 'chromium',
                seleniumGrid: {
                    gridUrl: 'http://selenium-hub:4444'
                }
            };
            
            plugin = new PlaywrightPlugin(config);
            
            // 这应该不会抛出错误
            expect(() => (plugin as any).setupSeleniumGridEnvironment()).to.not.throw();
        });

        it('should support msedge browser with Selenium Grid', async () => {
            const config: PlaywrightPluginConfig = {
                browserName: 'msedge',
                seleniumGrid: {
                    gridUrl: 'http://selenium-hub:4444'
                }
            };
            
            plugin = new PlaywrightPlugin(config);
            
            // 这应该不会抛出错误
            expect(() => (plugin as any).setupSeleniumGridEnvironment()).to.not.throw();
        });

        it('should reject firefox browser with Selenium Grid', async () => {
            const config: PlaywrightPluginConfig = {
                browserName: 'firefox',
                seleniumGrid: {
                    gridUrl: 'http://selenium-hub:4444'
                }
            };
            
            plugin = new PlaywrightPlugin(config);
            
            try {
                await (plugin as any).getBrowser();
                expect.fail('Should have thrown an error for Firefox with Selenium Grid');
            } catch (error) {
                expect((error as Error).message).to.include('Selenium Grid is not supported for Firefox');
            }
        });

        it('should reject webkit browser with Selenium Grid', async () => {
            const config: PlaywrightPluginConfig = {
                browserName: 'webkit',
                seleniumGrid: {
                    gridUrl: 'http://selenium-hub:4444'
                }
            };
            
            plugin = new PlaywrightPlugin(config);
            
            try {
                await (plugin as any).getBrowser();
                expect.fail('Should have thrown an error for WebKit with Selenium Grid');
            } catch (error) {
                expect((error as Error).message).to.include('Selenium Grid is not supported for WebKit');
            }
        });
    });

    describe('Grid Session Tests', () => {
        it.skip('should return grid information in gridTestSession when grid is enabled (requires real Selenium Grid)', async () => {
            // This test requires a real Selenium Grid instance running
            // Skipped in unit tests but can be enabled for integration testing
            const config: PlaywrightPluginConfig = {
                browserName: 'chromium',
                seleniumGrid: {
                    gridUrl: 'http://selenium-hub:4444',
                    gridCapabilities: {
                        'browserName': 'chrome'
                    }
                }
            };
            
            plugin = new PlaywrightPlugin(config);
            
            const sessionInfo = await plugin.gridTestSession('test-applicant');
            
            expect(sessionInfo).to.deep.include({
                sessionId: 'test-applicant',
                localSelenium: false,
                localPlaywright: false,
                seleniumGrid: true,
                gridUrl: 'http://selenium-hub:4444',
                browserName: 'chromium'
            });
            expect(sessionInfo.gridCapabilities).to.deep.equal({ 'browserName': 'chrome' });
        });

        it('should return local information in gridTestSession when grid is disabled', async () => {
            const config: PlaywrightPluginConfig = {
                browserName: 'chromium'
            };
            
            plugin = new PlaywrightPlugin(config);
            
            const sessionInfo = await plugin.gridTestSession('test-applicant');
            
            expect(sessionInfo).to.deep.include({
                sessionId: 'test-applicant',
                localSelenium: true,
                localPlaywright: true,
                seleniumGrid: false,
                gridUrl: null,
                browserName: 'chromium',
                gridCapabilities: null
            });
        });

        it.skip('should return grid information in getHubConfig when grid is enabled (requires real Selenium Grid)', async () => {
            // This test requires a real Selenium Grid instance running
            // Skipped in unit tests but can be enabled for integration testing
            const config: PlaywrightPluginConfig = {
                browserName: 'chromium',
                seleniumGrid: {
                    gridUrl: 'http://selenium-hub:4444',
                    gridCapabilities: {
                        'browserName': 'chrome'
                    },
                    gridHeaders: {
                        'Authorization': 'Bearer token'
                    }
                }
            };
            
            plugin = new PlaywrightPlugin(config);
            
            const hubConfig = await plugin.getHubConfig('test-applicant');
            
            expect(hubConfig).to.deep.include({
                sessionId: 'test-applicant',
                localSelenium: false,
                localPlaywright: false,
                seleniumGrid: true,
                gridUrl: 'http://selenium-hub:4444',
                browserName: 'chromium'
            });
            expect(hubConfig.gridCapabilities).to.deep.equal({ 'browserName': 'chrome' });
            expect(hubConfig.gridHeaders).to.deep.equal({ 'Authorization': 'Bearer token' });
        });
    });

    describe('Environment Variable Priority Tests', () => {
        it.skip('should prioritize environment variables over config (requires real Selenium Grid)', async () => {
            // This test requires a real Selenium Grid instance running
            // Skipped in unit tests but can be enabled for integration testing
            process.env['SELENIUM_REMOTE_URL'] = 'http://env-grid:4444';
            
            const config: PlaywrightPluginConfig = {
                browserName: 'chromium',
                seleniumGrid: {
                    gridUrl: 'http://config-grid:4444'
                }
            };
            
            plugin = new PlaywrightPlugin(config);
            
            const sessionInfo = await plugin.gridTestSession('test-applicant');
            
            expect(sessionInfo.gridUrl).to.equal('http://env-grid:4444');
        });
        
        it('should detect grid enabled when environment variable is set (config test only)', () => {
            process.env['SELENIUM_REMOTE_URL'] = 'http://env-grid:4444';
            
            const config: PlaywrightPluginConfig = {
                browserName: 'chromium',
                seleniumGrid: {
                    gridUrl: 'http://config-grid:4444'
                }
            };
            
            plugin = new PlaywrightPlugin(config);
            
            // Test environment variable setup only (not actual connection)
            (plugin as any).setupSeleniumGridEnvironment();
            
            // Environment variable should take precedence (not be overwritten)
            expect(process.env['SELENIUM_REMOTE_URL']).to.equal('http://env-grid:4444');
        });
    });
}); 