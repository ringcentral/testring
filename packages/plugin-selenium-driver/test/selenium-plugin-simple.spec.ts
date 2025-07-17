/// <reference types="mocha" />

import { expect } from 'chai';
import seleniumPlugin from '../src/index';
import * as path from 'path';

// Simple mock for testing
const mockBrowserProxy = {
    proxyPlugin: function(pluginPath: string, config: any) {
        this._pluginPath = pluginPath;
        this._config = config;
    },
    _pluginPath: '',
    _config: {}
};

const mockPluginAPI = {
    getBrowserProxy: () => mockBrowserProxy
};

describe('SeleniumPlugin Basic Tests', () => {
    it('should register plugin with browser proxy', () => {
        const config = {
            capabilities: {
                browserName: 'chrome'
            }
        };
        
        seleniumPlugin(mockPluginAPI as any, config as any);
        
        expect(mockBrowserProxy._pluginPath).to.equal(path.join(__dirname, '../src/plugin'));
        expect(mockBrowserProxy._config).to.deep.equal(config);
    });

    it('should handle empty config', () => {
        seleniumPlugin(mockPluginAPI as any, {} as any);
        expect(mockBrowserProxy._config).to.deep.equal({});
    });

    it('should handle Chrome configuration', () => {
        const config = {
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    args: ['--headless']
                }
            }
        };
        
        expect(() => {
            seleniumPlugin(mockPluginAPI as any, config as any);
        }).to.not.throw();
    });

    it('should handle Firefox configuration', () => {
        const config = {
            capabilities: {
                browserName: 'firefox',
                'moz:firefoxOptions': {
                    args: ['--headless']
                }
            }
        };
        
        expect(() => {
            seleniumPlugin(mockPluginAPI as any, config as any);
        }).to.not.throw();
    });

    it('should handle Grid configuration', () => {
        const config = {
            hostname: 'selenium-grid.example.com',
            port: 4444,
            capabilities: {
                browserName: 'chrome'
            }
        };
        
        expect(() => {
            seleniumPlugin(mockPluginAPI as any, config as any);
        }).to.not.throw();
    });
});