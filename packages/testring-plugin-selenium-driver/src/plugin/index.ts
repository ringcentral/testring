import { IBrowserProxyPlugin } from '@testring/types';
import { spawn } from '@testring/child-process';
import { Config, Client, remote } from 'webdriverio';
import { ChildProcess } from 'child_process';

/*
    TODO merge with master
 */


export class SeleniumPlugin implements IBrowserProxyPlugin {

    private browserClients: Map<string, Client<any>> = new Map();

    private localSelenium: ChildProcess;

    constructor(private config: Config) {
        if (this.config.host === undefined) {
            this.runLocalSelenium();
        }
    }

    private getClient(applicant) {
        if (!this.browserClients.has(applicant)) {
            this.browserClients.set(applicant, remote(this.config));
        }
        return this.browserClients.get(applicant);
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
            '-jar', seleniumJarPath
        ];

        this.localSelenium = spawn('java', args);

    }

    public kill() {
        this.localSelenium.kill();
    }

    async refresh(applicant: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].refresh();
        }
    }

    async click(applicant: string, selector: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].click(selector);
        }
    }

    async gridProxyDetails(applicant: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].gridProxyDetails();
        }
    }

    async url(applicant: string, val: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].url(val);
        }
    }

    async waitForExist(applicant: string, xpath: string, timeout: number) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].waitForExist(xpath, timeout);
        }
    }

    async waitForVisible(applicant: string, xpath: string, timeout: number) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].waitForVisible(xpath, timeout);
        }
    }

    async isVisible(applicant: string, xpath: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].isVisible(xpath);
        }
    }

    async moveToObject(applicant: string, xpath: string, x: number, y: number) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].moveToObject(xpath, x, y);
        }
    }

    async execute(applicant: string, fn: any, args: Array<any>) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].execute(fn, ...args);
        }
    }

    async executeAsync(applicant: string, fn: any, args: Array<any>) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].executeAsync(fn, ...args);
        }
    }

    async getTitle(applicant: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].getTitle();
        }
    }

    async clearElement(applicant: string, xpath: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].clearElement(xpath);
        }
    }

    async keys(applicant: string, value: any) {
        const client = this.getClient(applicant);
        if (client) {
            this.browserClients[applicant].keys(value);
        }
    }

    async elementIdText(applicant: string, elementId: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].elementIdText(elementId);
        }
    }

    async elements(applicant: string, xpath: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].elements(xpath);
        }
    }

    async getValue(applicant: string, xpath: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].getValue(xpath);
        }
    }

    async setValue(applicant: string, xpath: string, value: any) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].setValue(xpath, value);
        }
    }

    async selectByIndex(applicant: string, xpath: string, value: any) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].selectByIndex(xpath, value);
        }
    }

    async selectByValue(applicant: string, xpath: string, value: any) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].selectByValue(xpath, value);
        }
    }

    async selectByVisibleText(applicant: string, xpath: string, str: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].selectByVisibleText(xpath, str);
        }
    }

    async getAttribute(applicant: string, xpath: string, attr: any) {
        const client = this.getClient(applicant);
        if (client) {
            this.browserClients[applicant].getAttribute(xpath, attr);
        }
    }

    async windowHandleMaximize(applicant: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].windowHandleMaximize();
        }
    }

    async isEnabled(applicant: string, xpath: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].isEnabled(xpath);
        }
    }

    async scroll(applicant: string, xpath: string, x: number, y: number) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].scroll(xpath, x, y);
        }
    }

    async alertAccept(applicant: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].alertAccept();
        }
    }

    async alertDismiss(applicant: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].alertDismiss();
        }
    }

    async alertText(applicant: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].alertText();
        }
    }

    async dragAndDrop(applicant: string, xpathSource: string, xpathDestination: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].dragAndDrop(xpathSource, xpathDestination);
        }
    }

    async addCommand(applicant: string, str: string, fn: any) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].addCommand(str, fn);
        }
    }

    async getCookie(applicant: string, cookieName: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].getCookie(cookieName);
        }
    }

    async deleteCookie(applicant: string, cookieName: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].deleteCookie(cookieName);
        }
    }

    async getHTML(applicant: string, xpath: string, b: any) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].getHTML(xpath, b);
        }
    }

    async getCurrentTableId(applicant: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].getCurrentTabId();
        }
    }

    async switchTab(applicant: string, tabId: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].switchTab(tabId);
        }
    }

    async close(applicant: string, tabId: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].close(tabId);
        }
    }

    async getTabIds(applicant: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].getTabIds();
        }
    }

    async window(applicant: string, fn: any) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].window(fn);
        }
    }

    async windowHandles(applicant: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].windowHandles();
        }
    }


    async getTagName(applicant: string, xpath: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].getTagName(xpath);
        }
    }

    async isSelected(applicant: string, xpath: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].isSelected(xpath);
        }
    }

    async getText(applicant: string, xpath: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].getText(xpath);
        }
    }

    async elementIdSelected(applicant: string, id: string) {
        const client = this.getClient(applicant);
        if (client) {
            return this.browserClients[applicant].elementIdSelected(id);
        }
    }
}

export default function seleniumProxy(config: Config) {
    return new SeleniumPlugin(config);
}
