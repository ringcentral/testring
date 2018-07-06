import { IBrowserProxyPlugin } from '@testring/types';
import { spawn } from '@testring/child-process';
import { Config, Client, remote } from 'webdriverio';
import { ChildProcess } from 'child_process';
import { loggerClient } from '@testring/logger';


const DEFAULT_CONFIG: Config = {
    port: 4444,
    desiredCapabilities: {
        browserName: 'chrome'
    }
};

function delay(timeout) {
    return new Promise<void>((resolve) => setTimeout(() => resolve(), timeout));
}

export class SeleniumPlugin implements IBrowserProxyPlugin {

    private browserClients: Map<string, Client<any>> = new Map();

    private waitForReadyState: Promise<void> = Promise.resolve();

    private localSelenium: ChildProcess;

    private config: Config;

    constructor(config: Config) {
        this.config = config || {};

        if (this.config.host === undefined) {
            this.runLocalSelenium();
        }
    }

    private getChromeDriverArgs() {
        const chromeDriver = require('chromedriver');

        return [`-Dwebdriver.chrome.driver=${chromeDriver.path}`];
    }

    private async runLocalSelenium() {
        const seleniumServer = require('selenium-server');
        const seleniumJarPath = seleniumServer.path;

        this.localSelenium = spawn('java', [
            ...this.getChromeDriverArgs(),
            '-jar', seleniumJarPath,
            '-port', DEFAULT_CONFIG.port
        ]);

        this.waitForReadyState = new Promise((resolve) => {
            this.localSelenium.stderr.on('data', (data) => {
                const message = data.toString();

                loggerClient.debug(message);

                if (message.includes('SeleniumServer.boot')) {
                    delay(500).then(resolve);
                }
            });
        });
    }

    private async createClient(applicant: string): Promise<void> {
        await this.waitForReadyState;
        if (this.browserClients.has(applicant)) {
            return;
        }

        const client = remote({
            ...DEFAULT_CONFIG,
            ...this.config
        } as any);

        await client.init();

        this.browserClients.set(applicant, client);
    }

    public async end(applicant: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            this.browserClients.delete(applicant);
            return client.end();
        }
    }

    public async kill() {
        const requests: Array<any> = [];

        this.browserClients.forEach((client) => {
            requests.push(client.end());
        });

        this.localSelenium.kill();

        await Promise.all(requests);
    }

    public async refresh(applicant: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.refresh();
        }
    }

    public async click(applicant: string, selector: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.click(selector);
        }
    }

    public async gridProxyDetails(applicant: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.gridProxyDetails();
        }
    }

    public async url(applicant: string, val: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.url(val);
        }
    }

    public async waitForExist(applicant: string, xpath: string, timeout: number) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.waitForExist(xpath, timeout);
        }
    }

    public async waitForVisible(applicant: string, xpath: string, timeout: number) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.waitForVisible(xpath, timeout);
        }
    }

    public async isVisible(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.isVisible(xpath);
        }
    }

    public async moveToObject(applicant: string, xpath: string, x: number, y: number) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.moveToObject(xpath, x, y);
        }
    }

    public async execute(applicant: string, fn: any, args: Array<any>) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.execute(fn, ...args);
        }
    }

    public async executeAsync(applicant: string, fn: any, args: Array<any>) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.executeAsync(fn, ...args);
        }
    }

    public async getTitle(applicant: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.getTitle();
        }
    }

    public async clearElement(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.clearElement(xpath);
        }
    }

    public async keys(applicant: string, value: any) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            client.keys(value);
        }
    }

    public async elementIdText(applicant: string, elementId: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.elementIdText(elementId);
        }
    }

    public async elements(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.elements(xpath);
        }
    }

    public async getValue(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.getValue(xpath);
        }
    }

    public async setValue(applicant: string, xpath: string, value: any) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.setValue(xpath, value);
        }
    }

    public async selectByIndex(applicant: string, xpath: string, value: any) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.selectByIndex(xpath, value);
        }
    }

    public async selectByValue(applicant: string, xpath: string, value: any) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.selectByValue(xpath, value);
        }
    }

    public async selectByVisibleText(applicant: string, xpath: string, str: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.selectByVisibleText(xpath, str);
        }
    }

    public async getAttribute(applicant: string, xpath: string, attr: any) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            client.getAttribute(xpath, attr);
        }
    }

    public async windowHandleMaximize(applicant: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.windowHandleMaximize();
        }
    }

    public async isEnabled(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.isEnabled(xpath);
        }
    }

    public async scroll(applicant: string, xpath: string, x: number, y: number) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.scroll(xpath, x, y);
        }
    }

    public async alertAccept(applicant: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.alertAccept();
        }
    }

    public async alertDismiss(applicant: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.alertDismiss();
        }
    }

    public async alertText(applicant: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.alertText();
        }
    }

    public async dragAndDrop(applicant: string, xpathSource: string, xpathDestination: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.dragAndDrop(xpathSource, xpathDestination);
        }
    }

    public async addCommand(applicant: string, str: string, fn: any) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.addCommand(str, fn);
        }
    }

    public async getCookie(applicant: string, cookieName: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.getCookie(cookieName);
        }
    }

    public async deleteCookie(applicant: string, cookieName: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.deleteCookie(cookieName);
        }
    }

    public async getHTML(applicant: string, xpath: string, b: any) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.getHTML(xpath, b);
        }
    }

    public async getCurrentTableId(applicant: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.getCurrentTabId();
        }
    }

    public async switchTab(applicant: string, tabId: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.switchTab(tabId);
        }
    }

    public async close(applicant: string, tabId: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.close(tabId);
        }
    }

    public async getTabIds(applicant: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.getTabIds();
        }
    }

    public async window(applicant: string, fn: any) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.window(fn);
        }
    }

    public async windowHandles(applicant: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.windowHandles();
        }
    }


    public async getTagName(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.getTagName(xpath);
        }
    }

    public async isSelected(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.isSelected(xpath);
        }
    }

    public async getText(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.getText(xpath);
        }
    }

    public async elementIdSelected(applicant: string, id: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.elementIdSelected(id);
        }
    }

    public async makeScreenshot(applicant: string): Promise<Buffer | void> {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.saveScreenshot();
        }
    }
}

export default function seleniumProxy(config: Config) {
    return new SeleniumPlugin(config);
}
