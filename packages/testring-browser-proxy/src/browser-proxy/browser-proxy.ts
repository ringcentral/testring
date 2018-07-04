import {
    ITransport,
    IBrowserProxyCommand,
    IBrowserProxyMessage,
    BrowserProxyMessageTypes,
    IBrowserProxyPlugin
} from '@testring/types';
import { requirePlugin } from '@testring/utils';
import { loggerClient } from '@testring/logger';

const resolvePlugin = (pluginPath: string): (command: IBrowserProxyCommand) => IBrowserProxyPlugin => {
    const resolvedPlugin = requirePlugin(pluginPath);

    if (typeof resolvedPlugin !== 'function') {
        throw new TypeError('plugin is not a function');
    }

    return resolvedPlugin;
};

export class BrowserProxy {
    private readonly plugin: IBrowserProxyPlugin;

    constructor(
        private transportInstance: ITransport,
        pluginPath: string,
        pluginConfig: any
    ) {
        const pluginFactory = resolvePlugin(pluginPath);

        this.plugin = pluginFactory(pluginConfig);

        this.registerCommandListener();
    }


    private registerCommandListener() {
        loggerClient.debug(
            `Browser Proxy: Register listener for messages [type = ${BrowserProxyMessageTypes.execute}]`
        );

        this.transportInstance.on(
            BrowserProxyMessageTypes.execute,
            (message) => this.onMessage(message),
        );

        process.on('exit', () => {
            this.plugin.kill();
        });
    }

    private async onMessage(message: IBrowserProxyMessage) {
        const {uid, command} = message;

        try {
            await this.plugin[command.action](message.uid, ...command.args);

            loggerClient.debug(
                `Browser Proxy: Send message [type=${BrowserProxyMessageTypes.response}] to parent process`
            );
            this.transportInstance.broadcast(
                BrowserProxyMessageTypes.response,
                {
                    uid,
                },
            );
        } catch (exception) {
            this.transportInstance.broadcast(
                BrowserProxyMessageTypes.response,
                {
                    uid,
                    exception,
                },
            );
        }
    }
}
