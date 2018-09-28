import { Browser, Page, LaunchOptions, launch } from 'puppeteer';

const nanoid = require('nanoid');

type PageID = string;

export class BrowserInstance {

    private initialPromise: Promise<void>;

    private browser: Browser;

    private currentPage: PageID;

    private pages: Map<PageID, Page> = new Map();

    constructor(options: LaunchOptions) {
        this.initialPromise = this.createBrowserAPI(options);
    }

    public waitForInit() {
        return this.initialPromise;
    }

    public async getCurrentContext(): Promise<Page> {
        const existingPage = this.pages.get(this.currentPage);

        return existingPage || this.createPage();
    }

    public getCurrentPageID(): PageID {
        return this.currentPage;
    }

    public getPagesIDs() {
        return [...this.pages.keys()];
    }

    public async switchPage(pageID: PageID) {
        const page = this.pages.get(pageID);

        if (page) {
            this.currentPage = pageID;

            await page.bringToFront();
        }
    }

    public async closePage(pageToClose: PageID) {
        const page = this.pages.get(pageToClose);

        if (page) {
            this.pages.delete(pageToClose);

            await page.close();

            for (let [pageID] of this.pages) {
                this.currentPage = pageID;
                break;
            }
        }
    }

    public async kill() {
        const closeRequests: Array<Promise<void>> = [];

        this.pages.forEach((page) => closeRequests.push(page.close()));

        await Promise.all(closeRequests);
        await this.browser.close();
    }

    private async createBrowserAPI(options: LaunchOptions) {
        this.browser = await launch(options);

        await this.createPage();
    }

    private async createPage() {
        const page = await this.browser.newPage();
        const uid = nanoid();

        this.currentPage = uid;
        this.pages.set(uid, page);

        return page;
    }
}
