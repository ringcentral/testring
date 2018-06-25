import { IBrowserProxyPlugin } from '@testring/typings';
import { Config, Client, remote } from 'webdriverio';

class SeleniumPlugin implements IBrowserProxyPlugin {

    private browserClient: Client<void>;

    constructor(config: Config) {
        this.browserClient = remote(config);
    }

    async click(selector: string) {
        this.browserClient.click(selector);
    }
}

export default function seleniumProxy(config: Config) {
    return new SeleniumPlugin(config);
}
