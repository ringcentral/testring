/// <reference types="mocha" />

import * as sinon from 'sinon';
import { expect } from 'chai';
import playwrightPlugin from '../src/index';
import { PluginAPIMock } from './mocks/plugin-api.mock';
import * as path from 'path';

describe('PlaywrightPlugin', () => {
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
            const config = { browserName: 'chromium' as const };
            
            playwrightPlugin(pluginAPIMock as any, config);
            
            const browserProxy = pluginAPIMock.$getLastBrowserProxy();
            const registeredPath = browserProxy.$getProxyPlugin();
            const registeredConfig = browserProxy.$getProxyConfig();
            
            expect(registeredPath).to.equal(path.join(__dirname, '../src/plugin'));
            expect(registeredConfig).to.deep.equal(config);
        });

        it('should register plugin with empty config when no config provided', () => {
            playwrightPlugin(pluginAPIMock as any, {} as any);
            
            const browserProxy = pluginAPIMock.$getLastBrowserProxy();
            const registeredConfig = browserProxy.$getProxyConfig();
            
            expect(registeredConfig).to.deep.equal({});
        });

        it('should handle undefined config', () => {
            playwrightPlugin(pluginAPIMock as any, undefined as any);
            
            const browserProxy = pluginAPIMock.$getLastBrowserProxy();
            const registeredConfig = browserProxy.$getProxyConfig();
            
            expect(registeredConfig).to.deep.equal({});
        });
    });

    describe('Configuration Validation', () => {
        it('should accept valid chromium config', () => {
            const config = {
                browserName: 'chromium' as const,
                launchOptions: {
                    headless: true,
                    args: ['--no-sandbox']
                }
            };
            
            expect(() => {
                playwrightPlugin(pluginAPIMock as any, config);
            }).to.not.throw();
        });

        it('should accept valid firefox config', () => {
            const config = {
                browserName: 'firefox' as const,
                launchOptions: {
                    headless: false
                }
            };
            
            expect(() => {
                playwrightPlugin(pluginAPIMock as any, config);
            }).to.not.throw();
        });

        it('should accept valid webkit config', () => {
            const config = {
                browserName: 'webkit' as const,
                contextOptions: {
                    viewport: { width: 1920, height: 1080 }
                }
            };
            
            expect(() => {
                playwrightPlugin(pluginAPIMock as any, config);
            }).to.not.throw();
        });

        it('should accept debugging features config', () => {
            const config = {
                browserName: 'chromium' as const,
                coverage: true,
                video: true,
                trace: true,
                videoDir: './videos',
                traceDir: './traces'
            };
            
            expect(() => {
                playwrightPlugin(pluginAPIMock as any, config);
            }).to.not.throw();
        });
    });
});

// Export for compatibility testing
export { PluginAPIMock };