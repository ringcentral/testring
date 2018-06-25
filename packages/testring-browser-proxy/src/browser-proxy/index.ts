import { Transport } from '@testring/transport';
import { IBrowserProxyCommand, IBrowserProxyMessage } from '../../interfaces';
import { BrowserProxyMessageTypes } from '../structs';

const resolvePlugin = (pluginPath: string): (command: IBrowserProxyCommand) => Promise<void> => {
    // TODO use findPlugin (not from plugin-api, causes circular dep)
    const resolvedPlugin = require(pluginPath).default;

    if (typeof resolvedPlugin !== 'function') {
        throw new TypeError('plugin is not a function');
    }

    return resolvedPlugin;
};

export class BrowserProxy {
    constructor(
        private transportInstance: Transport,
        private onActionPlugin: string,
    ) {
        this.onAction = resolvePlugin(this.onActionPlugin);

        this.registerCommandListener();
    }

    private readonly onAction: (command: IBrowserProxyCommand) => Promise<void>;

    private registerCommandListener() {
        this.transportInstance.on(
            BrowserProxyMessageTypes.execute,
            (message) => this.onMessage(message),
        );
    }

    private async onMessage(message: IBrowserProxyMessage) {
        const { uid, command } = message;

        try {
            await this.onAction(command);

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
