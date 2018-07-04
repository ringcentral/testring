import { IBrowserProxyPlugin } from '@testring/types';
import { spawn } from '@testring/child-process';
import { Config, Client, remote } from 'webdriverio';
import { ChildProcess } from 'child_process';
import { loggerClient } from '@testring/logger';


const DEFAULT_CONFIG: Config = {
    port: 3031,
    desiredCapabilities: {
        browserName: 'chrome'
    }
};

function delay(timeout) {
    return new Promise((resolve) => setTimeout(() => resolve(), timeout));
}

export class SeleniumPlugin implements IBrowserProxyPlugin {

    private browserClients: Map<string, Client<any>> = new Map();

    private localSelenium: ChildProcess;

    constructor(private config: Config) {
        if (this.config.host === undefined) {
            this.runLocalSelenium();
        }
    }

    private async createClient(applicant: string): Promise<any> {
        if (this.browserClients.has(applicant)) {
            return;
        }

        await delay(1000);

        const client = remote({
            ...DEFAULT_CONFIG,
            ...this.config
        } as any);

        await client.init();

        this.browserClients.set(applicant, client);
    }

    private getChromeDriverArgs() {
        const chromeDriver = require('chromedriver');

        return [`-Dwebdriver.chrome.driver=${chromeDriver.path}`];
    }

    async runLocalSelenium() {
        const seleniumServer = require('selenium-server');
        const seleniumJarPath = seleniumServer.path;
        let args = [
            ...this.getChromeDriverArgs(),
            '-jar', seleniumJarPath,
            '-port', DEFAULT_CONFIG.port
        ];

        this.localSelenium = spawn('java', args);

        this.localSelenium.stdout.on('data', (data) => {
            loggerClient.debug(data.toString());
        });

        this.localSelenium.stderr.on('data', (data) => {
            loggerClient.debug(data.toString());
        });

    }

    public async kill() {
        const requests: Array<any> = [];

        this.browserClients.forEach((client) => {
            requests.push(client.end());
        });

        await Promise.all(requests);

        this.localSelenium.kill();
    }

    async refresh(applicant: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);

        if (client) {
            return client.refresh();
        }
    }

    async click(applicant: string, selector: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.click(selector);
        }
    }

    async gridProxyDetails(applicant: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.gridProxyDetails();
        }
    }

    async url(applicant: string, val: string) {
        await this.createClient(applicant);

        const client = this.browserClients.get(applicant);

        if (client) {
            return client.url(val);
        }
    }

    async waitForExist(applicant: string, xpath: string, timeout: number) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.waitForExist(xpath, timeout);
        }
    }

    async waitForVisible(applicant: string, xpath: string, timeout: number) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.waitForVisible(xpath, timeout);
        }
    }

    async isVisible(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.isVisible(xpath);
        }
    }

    async moveToObject(applicant: string, xpath: string, x: number, y: number) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.moveToObject(xpath, x, y);
        }
    }

    async execute(applicant: string, fn: any, args: Array<any>) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.execute(fn, ...args);
        }
    }

    async executeAsync(applicant: string, fn: any, args: Array<any>) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.executeAsync(fn, ...args);
        }
    }

    async getTitle(applicant: string) {
        await this.createClient(applicant);

        const client = this.browserClients.get(applicant);

        if (client) {
            return client.getTitle();
        }
    }

    async clearElement(applicant: string, xpath: string) {
        await this.createClient(applicant);

        const client = this.browserClients.get(applicant);

        if (client) {
            return client.clearElement(xpath);
        }
    }

    async keys(applicant: string, value: any) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            client.keys(value);
        }
    }

    async elementIdText(applicant: string, elementId: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.elementIdText(elementId);
        }
    }

    async elements(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.elements(xpath);
        }
    }

    async getValue(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.getValue(xpath);
        }
    }

    async setValue(applicant: string, xpath: string, value: any) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.setValue(xpath, value);
        }
    }

    async selectByIndex(applicant: string, xpath: string, value: any) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.selectByIndex(xpath, value);
        }
    }

    async selectByValue(applicant: string, xpath: string, value: any) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.selectByValue(xpath, value);
        }
    }

    async selectByVisibleText(applicant: string, xpath: string, str: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.selectByVisibleText(xpath, str);
        }
    }

    async getAttribute(applicant: string, xpath: string, attr: any) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            client.getAttribute(xpath, attr);
        }
    }

    async windowHandleMaximize(applicant: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.windowHandleMaximize();
        }
    }

    async isEnabled(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.isEnabled(xpath);
        }
    }

    async scroll(applicant: string, xpath: string, x: number, y: number) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.scroll(xpath, x, y);
        }
    }

    async alertAccept(applicant: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.alertAccept();
        }
    }

    async alertDismiss(applicant: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.alertDismiss();
        }
    }

    async alertText(applicant: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.alertText();
        }
    }

    async dragAndDrop(applicant: string, xpathSource: string, xpathDestination: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.dragAndDrop(xpathSource, xpathDestination);
        }
    }

    async addCommand(applicant: string, str: string, fn: any) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.addCommand(str, fn);
        }
    }

    async getCookie(applicant: string, cookieName: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.getCookie(cookieName);
        }
    }

    async deleteCookie(applicant: string, cookieName: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.deleteCookie(cookieName);
        }
    }

    async getHTML(applicant: string, xpath: string, b: any) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.getHTML(xpath, b);
        }
    }

    async getCurrentTableId(applicant: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.getCurrentTabId();
        }
    }

    async switchTab(applicant: string, tabId: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.switchTab(tabId);
        }
    }

    async close(applicant: string, tabId: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.close(tabId);
        }
    }

    async getTabIds(applicant: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.getTabIds();
        }
    }

    async window(applicant: string, fn: any) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.window(fn);
        }
    }

    async windowHandles(applicant: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.windowHandles();
        }
    }


    async getTagName(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.getTagName(xpath);
        }
    }

    async isSelected(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.isSelected(xpath);
        }
    }

    async getText(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.getText(xpath);
        }
    }

    async elementIdSelected(applicant: string, id: string) {
        await this.createClient(applicant);
        const client = this.browserClients.get(applicant);
        if (client) {
            return client.elementIdSelected(id);
        }
    }
}

export default function seleniumProxy(config: Config) {
    return new SeleniumPlugin(config);
}
