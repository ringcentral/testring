import { LaunchOptions } from 'puppeteer';
import { IBrowserProxyPlugin } from '@testring/types';
import { BrowserInstance } from './browser-instance';

const DEFAULT_CONFIG: LaunchOptions = {
    headless: false,
};

function delay(timeout) {
    return new Promise<void>((resolve) => setTimeout(() => resolve(), timeout));
}

export class PuppeteerPlugin implements IBrowserProxyPlugin {

    private browserClients: Map<string, BrowserInstance> = new Map();

    constructor(private config: LaunchOptions = {}) {
    }

    private async createClient(applicant: string): Promise<void> {
        if (this.browserClients.has(applicant)) {
            return;
        }

        const browserInstance = new BrowserInstance({
            ...DEFAULT_CONFIG,
            ...this.config
        });

        this.browserClients.set(applicant, browserInstance);

        await browserInstance.waitForInit();
    }

    public async end(applicant: string) {
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            this.browserClients.delete(applicant);

            await browserInstance.kill();
        }
    }

    public async kill() {
        for (const applicant of this.browserClients.keys()) {
            await this.end(applicant);
        }

        // safe buffer if clients are still active
        await delay(2000);
    }

    public async refresh(applicant: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return client.reload();
        }
    }

    public async click(applicant: string, selector: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return client.click(selector);
        }
    }

    public async url(applicant: string, url: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            await client.goto(url);
        }
    }

    public async waitForExist(applicant: string, xpath: string, timeout: number) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return client.waitForXPath(xpath, { timeout });
        }
    }

    public async waitForVisible(applicant: string, xpath: string, timeout: number) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return client.waitForXPath(xpath, { timeout, visible: true });
        }
    }

    public async isVisible(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return !!client.waitForXPath(xpath, { timeout: 50, visible: true });
        }
    }

    public async moveToObject(applicant: string, xpath: string, x: number, y: number) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.moveToObject(xpath, x, y);
        }
    }

    public async execute(applicant: string, fn: any, args: Array<any>) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return client.evaluate(fn, ...args);
        }
    }

    public async executeAsync(applicant: string, fn: any, args: Array<any>) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return client.evaluate(fn, ...args);
        }
    }

    public async getTitle(applicant: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return client.title();
        }
    }

    public async clearElement(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.clearElement(xpath);
        }
    }

    public async keys(applicant: string, value: any) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            // browserInstance.keys(value);
        }
    }

    public async elementIdText(applicant: string, elementId: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.elementIdText(elementId);
        }
    }

    public async elements(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.elements(xpath);
        }
    }

    public async frame(applicant: string, frameID: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.frame(frameID);
        }
    }

    public async frameParent(applicant: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.frameParent();
        }
    }

    public async getValue(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return client.$eval(xpath, (node: any) => node.value);
        }
    }

    public async setValue(applicant: string, xpath: string, value: any) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return client.type(xpath, value);
        }
    }

    public async selectByIndex(applicant: string, xpath: string, value: any) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.selectByIndex(xpath, value);
        }
    }

    public async selectByValue(applicant: string, xpath: string, value: any) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.selectByValue(xpath, value);
        }
    }

    public async selectByVisibleText(applicant: string, xpath: string, str: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.selectByVisibleText(xpath, str);
        }
    }

    public async getAttribute(applicant: string, xpath: string, attr: string): Promise<any> {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            const attributes = await client.$eval(xpath, (node) => node.attributes);

            return attributes[attr];
        }
    }

    public async windowHandleMaximize(applicant: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.windowHandleMaximize();
        }
    }

    public async isEnabled(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.isEnabled(xpath);
        }
    }

    public async scroll(applicant: string, xpath: string, x: number, y: number) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.scroll(xpath, x, y);
        }
    }

    public async alertAccept(applicant: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.alertAccept();
        }
    }

    public async alertDismiss(applicant: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.alertDismiss();
        }
    }

    public async alertText(applicant: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.alertText();
        }
    }

    public async dragAndDrop(applicant: string, xpathSource: string, xpathDestination: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.dragAndDrop(xpathSource, xpathDestination);
        }
    }

    public async getCookie(applicant: string, cookieName: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            const cookies = await client.cookies();

            return cookies.find((cookie) => cookie.name === cookieName);
        }
    }

    public async deleteCookie(applicant: string, cookieName: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return client.deleteCookie({
                name: cookieName
            });
        }
    }

    public async getHTML(applicant: string, xpath: string, b: any) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return client.$eval(xpath, (node) => node.innerHTML);
        }
    }

    public async getCurrentTabId(applicant: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            return browserInstance.getCurrentPageID();
        }
    }

    public async switchTab(applicant: string, pageID: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            return browserInstance.switchPage(pageID);
        }
    }

    public async close(applicant: string, pageID: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            return browserInstance.closePage(pageID);
        }
    }

    public async getTabIds(applicant: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            return browserInstance.getPagesIDs();
        }
    }

    public async window(applicant: string, fn: any) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.window(fn);
        }
    }

    public async windowHandles(applicant: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.windowHandles();
        }
    }


    public async getTagName(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return client.$eval(xpath, (node) => node.tagName);
        }
    }

    public async isSelected(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.isSelected(xpath);
        }
    }

    public async getText(applicant: string, xpath: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return client.$eval(xpath, (node) => node.textContent);
        }
    }

    public async elementIdSelected(applicant: string, id: string) {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.elementIdSelected(id);
        }
    }

    public async makeScreenshot(applicant: string): Promise<string | void> {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return client.screenshot();
        }
    }

    public async uploadFile(applicant: string, filePath: string): Promise<string | void> {
        await this.createClient(applicant);
        const browserInstance = this.browserClients.get(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.uploadFile(filePath);
        }
    }
}

export default function puppeteerProxy(config: LaunchOptions) {
    return new PuppeteerPlugin(config);
}
