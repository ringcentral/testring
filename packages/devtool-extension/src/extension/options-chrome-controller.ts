import {
    IExtensionApplicationConfig,
    WebApplicationDevtoolCallback,
} from '@testring/types';
import { BackgroundChromeClient } from './chrome-transport/chrome-client';

export interface IOptionsWindow extends Window {
    resolveWebApp: WebApplicationDevtoolCallback | undefined;
}

export class OptionsChromeController {
    constructor(private window: IOptionsWindow) {
        this.initListeners();
    }

    private initListeners() {
        this.window.document.addEventListener('DOMContentLoaded',  () => {
            this.renderPages();
        });
    }

    private getSearchParams(): URLSearchParams {
        return new URLSearchParams(this.window.location.search);
    }

    private redrawDocument(template: string) {
        this.window.document.body.innerHTML = template;
    }

    // Default pages
    private entryPageTemplate(): string {
        return '<h1>Do not use this page manually</h1>';
    }

    private renderEntryPage(): void {
        this.redrawDocument(this.entryPageTemplate());
    }

    private pageDefaultTemplate(pageName: string): string {
        return `<h1>Page ${pageName} not found</h1>`;
    }

    private handlePageDefault(): void {
        const pageName = this.getSearchParams().get('page');

        if (pageName) {
            this.redrawDocument(this.pageDefaultTemplate(pageName));
        } else {
            this.renderEntryPage();
        }
    }

    // Error page
    private async handleErrorPage(error: Error) {
        this.redrawDocument(`
            <h1>Error: ${error.message}</h1>
            <pre>
${error.stack}
            </pre>
        `);
    }


    private handshakePageTemplate(data: IExtensionApplicationConfig) {
        return `
            <h1>Setting devtool options</h1>
            
            <h3>Waiting for handshake...</h3>
            
            <p>
                Host:
                <span id="host">${data.host}</span>
            </p>
            <p>
                Http port:
                <span id="httpPort">${data.httpPort}</span>
            </p>
            <p>
                WS port:
                <span id="wsPort">${data.wsPort}</span>
            </p>
            <p>
                App id:
                <span id="appId">${data.appId}</span>
            </p>
        `;
    }

    private getHandshakeConfig(searchParams: URLSearchParams): IExtensionApplicationConfig {
        const config: Partial<IExtensionApplicationConfig> = {};

        for (let key of ['httpPort', 'wsPort', 'appId', 'host']) {
            if (searchParams.has(key)) {
                const value = searchParams.get(key);
                const parsedValue = ['httpPort', 'wsPort'].includes(key) ? Number(value) : value;

                if (parsedValue === null) {
                    throw Error(`Field ${key} is required`);
                } else if (typeof parsedValue === 'string' && parsedValue === '') {
                    throw Error(`Field ${key} can not be empty`);
                } else if (typeof parsedValue === 'number' && isNaN(parsedValue)) {
                    throw Error(`Field ${key} should be a number`);
                }

                config[key] = parsedValue;
            } else {
                throw Error(`No ${key} is passed`);
            }
        }

        return config as IExtensionApplicationConfig;
    }

    private async requestHandshake(config: IExtensionApplicationConfig) {
        const chromeClient = new BackgroundChromeClient();
        chromeClient.setConfig(config);

        await chromeClient.waitForReady();
    }

    private async responseHandshake(error: Error | null = null) {
        let callback: WebApplicationDevtoolCallback | null = null;
        let checkCount = 0;

        while (callback === null && checkCount < 10)  {
            // Waiting for selenium to add resolve callback in window
            await new Promise(resolve => setTimeout(resolve, 300));

            if (typeof this.window.resolveWebApp === 'function') {
                callback = this.window.resolveWebApp;
            }

            checkCount++;
        }

        if (callback === null) {
            throw Error('No resolveWebApp function is passed');
        }

        callback(error);
    }

    private async handleHandshakePage(): Promise<void> {
        let requestError: Error | null = null;

        try {
            const searchParams = this.getSearchParams();
            const config  = this.getHandshakeConfig(searchParams);

            this.redrawDocument(this.handshakePageTemplate(config));

            await this.requestHandshake(config);
        } catch (e) {
            requestError = e;
        }

        if (requestError) {
            this.handleErrorPage(requestError);
            try {
                await this.responseHandshake(requestError);
            } catch (e) { /* ignore */ }
        } else {
            await this.responseHandshake();
        }
    }

    private async renderPages(): Promise<void> {
        const params = this.getSearchParams();

        try {
            switch (params.get('page')) {
                case 'handshake':
                    await this.handleHandshakePage();
                    break;

                default:
                    await this.handlePageDefault();
            }
        } catch (err) {
            await this.handleErrorPage(err);
        }
    }
}
