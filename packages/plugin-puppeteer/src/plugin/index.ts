import { LaunchOptions } from 'puppeteer';
import { IBrowserProxyPlugin } from '@testring/types';
import { BrowserInstance } from './browser-instance';

const DEFAULT_CONFIG: LaunchOptions = {
    headless: true,
};

function delay(timeout) {
    return new Promise<void>((resolve) => setTimeout(() => resolve(), timeout));
}

export class PuppeteerPlugin implements IBrowserProxyPlugin {

    private browserClients: Map<string, BrowserInstance> = new Map();

    constructor(private config: LaunchOptions = {}) {
    }

    private async createClient(applicant: string): Promise<BrowserInstance> {
        const currentBrowserInstance = this.browserClients.get(applicant);

        if (currentBrowserInstance) {
            await currentBrowserInstance.waitForInit();

            return currentBrowserInstance;
        }

        const browserInstance = new BrowserInstance({
            ...DEFAULT_CONFIG,
            ...this.config
        });

        this.browserClients.set(applicant, browserInstance);

        await browserInstance.waitForInit();

        return browserInstance;
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
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return client.reload();
        }
    }

    public async click(applicant: string, selector: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();

            await client.waitForXPath(selector);

            const elements = await client.$x(selector);

            if (elements.length) {
                await elements[0].click();
            }
        }
    }

    public async url(applicant: string, url: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            await client.goto(url);
        }
    }

    public async waitForExist(applicant: string, xpath: string, timeout: number) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();

            return !!client.waitForXPath(xpath, { timeout });
        }
    }

    public async waitForVisible(applicant: string, xpath: string, timeout: number) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();

            return !!client.waitForXPath(xpath, { timeout, visible: true });
        }
    }

    public async isVisible(applicant: string, xpath: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return !!client.waitForXPath(xpath, { timeout: 50, visible: true });
        }
    }

    public async moveToObject(applicant: string, xpath: string, x: number, y: number) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.moveToObject(xpath, x, y);
        }
    }

    public async execute(applicant: string, fn: any, args: Array<any>) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return client.evaluate(fn, ...args);
        }
    }

    public async executeAsync(applicant: string, fn: any, args: Array<any>) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return client.evaluate(fn, ...args);
        }
    }

    public async getTitle(applicant: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return client.title();
        }
    }

    public async clearElement(applicant: string, xpath: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.clearElement(xpath);
        }
    }

    public async keys(applicant: string, value: any) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            // browserInstance.keys(value);
        }
    }

    public async elementIdText(applicant: string, elementId: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.elementIdText(elementId);
        }
    }

    public async elements(applicant: string, xpath: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.elements(xpath);
        }
    }

    public async frame(applicant: string, frameID: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.frame(frameID);
        }
    }

    public async frameParent(applicant: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.frameParent();
        }
    }

    public async getValue(applicant: string, selector: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();

            await client.waitForXPath(selector);

            const elements = await client.$x(selector);

            if (elements.length) {
                return await client.evaluate((node) => node.value, elements[0]);
            }

            return null;
        }
    }

    public async setValue(applicant: string, selector: string, value: any) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();

            await client.waitForXPath(selector);

            const elements = await client.$x(selector);

            if (elements.length) {
                await elements[0].type(value);
            }
        }
    }

    public async selectByIndex(applicant: string, xpath: string, value: any) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.selectByIndex(xpath, value);
        }
    }

    public async selectByValue(applicant: string, xpath: string, value: any) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.selectByValue(xpath, value);
        }
    }

    public async selectByVisibleText(applicant: string, xpath: string, str: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.selectByVisibleText(xpath, str);
        }
    }

    public async getAttribute(applicant: string, selector: string, attr: string): Promise<any> {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();

            await client.waitForXPath(selector);

            const elements = await client.$x(selector);

            if (elements.length) {
                return await client.evaluate(
                    (node, attr) => node.getAttribute(attr),
                    elements[0],
                    attr,
                );
            }

            return null;
        }
    }

    public async windowHandleMaximize(applicant: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.windowHandleMaximize();
        }
    }

    public async isEnabled(applicant: string, xpath: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.isEnabled(xpath);
        }
    }

    public async scroll(applicant: string, xpath: string, x: number, y: number) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.scroll(xpath, x, y);
        }
    }

    public async alertAccept(applicant: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.alertAccept();
        }
    }

    public async alertDismiss(applicant: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.alertDismiss();
        }
    }

    public async alertText(applicant: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.alertText();
        }
    }

    public async dragAndDrop(applicant: string, xpathSource: string, xpathDestination: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.dragAndDrop(xpathSource, xpathDestination);
        }
    }

    public async getCookie(applicant: string, cookieName: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            const cookies = await client.cookies();

            return cookies.find((cookie) => cookie.name === cookieName);
        }
    }

    public async deleteCookie(applicant: string, cookieName: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return client.deleteCookie({
                name: cookieName
            });
        }
    }

    public async getHTML(applicant: string, xpath: string, b: any) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return client.$eval(xpath, (node) => node.innerHTML);
        }
    }

    public async getCurrentTabId(applicant: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            return browserInstance.getCurrentPageID();
        }
    }

    public async switchTab(applicant: string, pageID: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            return browserInstance.switchPage(pageID);
        }
    }

    public async close(applicant: string, pageID: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            return browserInstance.closePage(pageID);
        }
    }

    public async getTabIds(applicant: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            return browserInstance.getPagesIDs();
        }
    }

    public async window(applicant: string, fn: any) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.window(fn);
        }
    }

    public async windowHandles(applicant: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.windowHandles();
        }
    }


    public async getTagName(applicant: string, xpath: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return client.$eval(xpath, (node) => node.tagName);
        }
    }

    public async isSelected(applicant: string, xpath: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.isSelected(xpath);
        }
    }

    public async getText(applicant: string, xpath: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();

            await client.waitForXPath(xpath);

            const element = await client.$x(xpath);

            if (element.length) {
                const textContent = await element[0].getProperty('textContent');

                return await textContent.jsonValue();
            }

            return '';
        }
    }

    public async elementIdSelected(applicant: string, id: string) {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.elementIdSelected(id);
        }
    }

    public async makeScreenshot(applicant: string): Promise<string | void> {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            const client = await browserInstance.getCurrentContext();
            return client.screenshot();
        }
    }

    public async uploadFile(applicant: string, filePath: string): Promise<string | void> {
        const browserInstance = await this.createClient(applicant);

        if (browserInstance) {
            // const client = await browserInstance.getCurrentContext();
            // return client.uploadFile(filePath);
        }
    }
}

export default function puppeteerProxy(config: LaunchOptions) {
    return new PuppeteerPlugin(config);
}
