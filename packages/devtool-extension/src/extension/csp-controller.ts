import {IExtensionNetworkConfig} from '@testring-dev/types';

// @see base code https://transitory.technology/browser-extensions-and-csp-headers
export class CSPController {
    private serverConfig: IExtensionNetworkConfig | null = null;

    constructor() {
        chrome.webRequest.onHeadersReceived.addListener(
            (details) => this.modifyCspHeaders(details),
            {
                urls: ['http://*/*', 'https://*/*'],
                types: ['main_frame'],
            },
            ['blocking', 'responseHeaders'],
        );
    }

    public setConfig(serverConfig: IExtensionNetworkConfig) {
        this.serverConfig = serverConfig;
    }

    // @see https://developer.mozilla.org/en-US/docs/Web/Security/CSP
    private cspHeaders = ['content-security-policy', 'x-webkit-csp'];

    // @see https://developer.mozilla.org/en-US/docs/Web/Security/CSP/CSP_policy_directives
    private cspSources = [
        'connect-src',
        'default-src',
        'font-src',
        'frame-src',
        'img-src',
        'media-src',
        'object-src',
        'script-src',
        'style-src',
    ];

    private isCspHeader(headerName) {
        return this.cspHeaders.includes(headerName.toLowerCase());
    }

    private getScpUrls(cspSource) {
        if (this.serverConfig) {
            return `${cspSource} ${this.serverConfig.host}:${this.serverConfig.httpPort}`;
        }

        return cspSource;
    }

    private modifyCspHeaders(details) {
        if (this.serverConfig !== null) {
            details.responseHeaders.forEach((responseHeader) => {
                if (!this.isCspHeader(responseHeader.name)) {
                    return;
                }

                let csp = responseHeader.value;

                this.cspSources.forEach((cspSource) => {
                    csp = csp.replace(cspSource, this.getScpUrls(cspSource));
                });

                responseHeader.value = csp;
            });

            return {responseHeaders: details.responseHeaders};
        }
    }
}
