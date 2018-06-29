import { ITransport, IBrowserProxyCommand, IBrowserProxyMessage, BrowserProxyMessageTypes } from '@testring/types';
import { requirePackage } from '@testring/utils';
import { loggerClient } from '@testring/logger';

const resolvePlugin = (pluginPath: string): (command: IBrowserProxyCommand) => Promise<void> => {
    const resolvedPlugin = requirePackage(pluginPath);

    if (typeof resolvedPlugin !== 'function') {
        throw new TypeError('plugin is not a function');
    }

    return resolvedPlugin;
};

export class BrowserProxy {
    constructor(
        private transportInstance: ITransport,
        private onActionPlugin: string,
    ) {
        this.onAction = resolvePlugin(this.onActionPlugin);

        this.registerCommandListener();
    }

    private readonly onAction: (command: IBrowserProxyCommand) => Promise<void>;

    private registerCommandListener() {
        loggerClient.debug(`Browser Proxy: Register listener for messages [type = ${BrowserProxyMessageTypes.execute}]`);
        this.transportInstance.on(
            BrowserProxyMessageTypes.execute,
            (message) => this.onMessage(message),
        );
    }

    private async onMessage(message: IBrowserProxyMessage) {
        const { uid, command } = message;

        try {
            await this.onAction(command);
            loggerClient.debug(`Browser Proxy: Send message [type=${BrowserProxyMessageTypes.response}] to parent process`);
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
