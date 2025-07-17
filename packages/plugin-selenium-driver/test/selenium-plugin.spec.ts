/// <reference types="mocha" />

import * as sinon from 'sinon';
import { expect } from 'chai';
import seleniumPlugin from '../src/index';
import { SeleniumPluginConfig } from '../src/types';
import * as path from 'path';

// Mock plugin API for testing
class BrowserProxyAPIMock {
    private proxyPluginPath: any;
    private proxyConfig: any;

    proxyPlugin(pluginPath: string, config: any) {
        this.proxyPluginPath = pluginPath;
        this.proxyConfig = config;
    }

    $getProxyPlugin() {
        return this.proxyPluginPath;
    }

    $getProxyConfig() {
        return this.proxyConfig;
    }
}

class PluginAPIMock {
    private lastBrowserProxy: BrowserProxyAPIMock = new BrowserProxyAPIMock();

    getBrowserProxy(): BrowserProxyAPIMock {
        this.lastBrowserProxy = new BrowserProxyAPIMock();
        return this.lastBrowserProxy;
    }

    $getLastBrowserProxy(): BrowserProxyAPIMock {
        return this.lastBrowserProxy;
    }
}

describe('SeleniumPlugin', () => {
    let pluginAPIMock: PluginAPIMock;
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        pluginAPIMock = new PluginAPIMock();
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Plugin Registration', () => {
        it('should register plugin with browser proxy', () => {
            const config: Partial<SeleniumPluginConfig> = {
                recorderExtension: false,
                clientCheckInterval: 5000,
                clientTimeout: 900000,
                cdpCoverage: false,
                capabilities: {
                    browserName: 'chrome'
                }
            };
            
            seleniumPlugin(pluginAPIMock as any, config as any);
            
            const browserProxy = pluginAPIMock.$getLastBrowserProxy();
            const registeredPath = browserProxy.$getProxyPlugin();
            const registeredConfig = browserProxy.$getProxyConfig();
            
            expect(registeredPath).to.equal(path.join(__dirname, '../src/plugin'));
            expect(registeredConfig).to.deep.equal(config);
        });

        it('should register plugin with empty config when no config provided', () => {
            seleniumPlugin(pluginAPIMock as any, {} as any);
            
            const browserProxy = pluginAPIMock.$getLastBrowserProxy();
            const registeredConfig = browserProxy.$getProxyConfig();
            
            expect(registeredConfig).to.deep.equal({});
        });

        it('should handle undefined config', () => {
            seleniumPlugin(pluginAPIMock as any, undefined as any);
            
            const browserProxy = pluginAPIMock.$getLastBrowserProxy();
            const registeredConfig = browserProxy.$getProxyConfig();
            
            expect(registeredConfig).to.deep.equal({});
        });
    });

    describe('Configuration Validation', () => {
        it('should accept valid Chrome config', () => {
            const config: Partial<SeleniumPluginConfig> = {
                capabilities: {
                    browserName: 'chrome',
                    'goog:chromeOptions': {
                        args: ['--headless', '--no-sandbox']
                    }
                }
            };
            
            expect(() => {
                seleniumPlugin(pluginAPIMock as any, config as any);
            }).to.not.throw();
        });

        it('should accept valid Firefox config', () => {
            const config: Partial<SeleniumPluginConfig> = {
                capabilities: {
                    browserName: 'firefox',
                    'moz:firefoxOptions': {
                        args: ['--headless']
                    }
                }
            };
            
            expect(() => {
                seleniumPlugin(pluginAPIMock as any, config as any);
            }).to.not.throw();
        });

        it('should accept grid configuration', () => {
            const config: Partial<SeleniumPluginConfig> = {
                hostname: 'selenium-grid.example.com',
                port: 4444,
                capabilities: {
                    browserName: 'chrome'
                }
            };
            
            expect(() => {
                seleniumPlugin(pluginAPIMock as any, config as any);
            }).to.not.throw();
        });

        it('should accept CDP coverage configuration', () => {
            const config: Partial<SeleniumPluginConfig> = {
                cdpCoverage: true,
                capabilities: {
                    browserName: 'chrome'
                }
            };
            
            expect(() => {
                seleniumPlugin(pluginAPIMock as any, config as any);
            }).to.not.throw();
        });

        it('should accept timeout configurations', () => {
            const config: Partial<SeleniumPluginConfig> = {
                clientTimeout: 600000, // 10 minutes
                clientCheckInterval: 10000, // 10 seconds
                disableClientPing: true
            };
            
            expect(() => {
                seleniumPlugin(pluginAPIMock as any, config as any);
            }).to.not.throw();
        });

        it('should accept recorder extension configuration', () => {
            const config: Partial<SeleniumPluginConfig> = {
                recorderExtension: true,
                capabilities: {
                    browserName: 'chrome'
                }
            };
            
            expect(() => {
                seleniumPlugin(pluginAPIMock as any, config as any);
            }).to.not.throw();
        });

        it('should accept worker limit configuration', () => {
            const config: Partial<SeleniumPluginConfig> = {
                workerLimit: 'local',
                capabilities: {
                    browserName: 'chrome'
                }
            };
            
            expect(() => {
                seleniumPlugin(pluginAPIMock as any, config as any);
            }).to.not.throw();
        });

        it('should accept delay after session close configuration', () => {
            const config: Partial<SeleniumPluginConfig> = {
                delayAfterSessionClose: 1000,
                capabilities: {
                    browserName: 'chrome'
                }
            };
            
            expect(() => {
                seleniumPlugin(pluginAPIMock as any, config as any);
            }).to.not.throw();
        });
    });

    describe('WebDriverIO Configuration Compatibility', () => {
        it('should accept modern WebDriverIO v9 configuration', () => {
            const config: Partial<SeleniumPluginConfig> = {
                hostname: 'localhost',
                port: 4444,
                capabilities: {
                    browserName: 'chrome',
                    'wdio:enforceWebDriverClassic': true,
                    'goog:chromeOptions': {
                        args: ['--headless']
                    }
                },
                logLevel: 'error'
            };
            
            expect(() => {
                seleniumPlugin(pluginAPIMock as any, config as any);
            }).to.not.throw();
        });

        it('should accept legacy WebDriverIO configuration', () => {
            const config: Partial<SeleniumPluginConfig> = {
                host: 'localhost', // Legacy field
                desiredCapabilities: [{ // Legacy field
                    browserName: 'chrome'
                }]
            };
            
            expect(() => {
                seleniumPlugin(pluginAPIMock as any, config as any);
            }).to.not.throw();
        });
    });

    describe('Edge Cases', () => {
        it('should handle null config gracefully', () => {
            expect(() => {
                seleniumPlugin(pluginAPIMock as any, null as any);
            }).to.not.throw();
        });

        it('should handle config with only some fields', () => {
            const config: Partial<SeleniumPluginConfig> = {
                recorderExtension: true
            };
            
            expect(() => {
                seleniumPlugin(pluginAPIMock as any, config as any);
            }).to.not.throw();
        });

        it('should handle minimal configuration', () => {
            const config: Partial<SeleniumPluginConfig> = {
                capabilities: {
                    browserName: 'chrome'
                }
            };
            
            expect(() => {
                seleniumPlugin(pluginAPIMock as any, config as any);
            }).to.not.throw();
        });
    });
});