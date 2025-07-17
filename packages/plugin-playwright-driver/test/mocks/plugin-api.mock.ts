export class BrowserProxyAPIMock {
    private proxyPluginPath: any;
    private proxyConfig: any;

    proxyPlugin(pluginPath: string, config: any) {
        this.proxyPluginPath = pluginPath;
        this.proxyConfig = config;
    }

    $getProxyPlugin() {
        return this.proxyPluginPath;
    }

    $getProxyConfig() {
        return this.proxyConfig;
    }
}

export class PluginAPIMock {
    private lastBrowserProxy: BrowserProxyAPIMock = new BrowserProxyAPIMock();

    getBrowserProxy(): BrowserProxyAPIMock {
        this.lastBrowserProxy = new BrowserProxyAPIMock();
        return this.lastBrowserProxy;
    }

    $getLastBrowserProxy(): BrowserProxyAPIMock {
        return this.lastBrowserProxy;
    }
}