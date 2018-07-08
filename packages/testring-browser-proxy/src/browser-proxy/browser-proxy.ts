import {
    ITransport,
    IBrowserProxyMessage,
    IBrowserProxyCommandResponse,
    IBrowserProxyPlugin,
    BrowserProxyMessageTypes,
    BrowserProxyActions
} from '@testring/types';
import { requirePlugin } from '@testring/utils';
import { loggerClient } from '@testring/logger';

const resolvePlugin = (pluginPath: string): IBrowserProxyPlugin => {
    const resolvedPlugin = requirePlugin(pluginPath);

    if (typeof resolvedPlugin !== 'function') {
        throw new TypeError('plugin is not a function');
    }

    return resolvedPlugin;
};

export class BrowserProxy {
    private plugin: IBrowserProxyPlugin;

    constructor(
        private transportInstance: ITransport,
        pluginPath: string,
        pluginConfig: any
    ) {
        this.loadPlugin(pluginPath, pluginConfig);
        this.registerCommandListener();
    }

    private loadPlugin(pluginPath: string, pluginConfig: any) {
        let pluginFactory;

        try {
            pluginFactory = resolvePlugin(pluginPath);
        } catch (error) {
            loggerClient.debug(`Can't load plugin ${pluginPath}`, error);
        }

        if (pluginFactory) {
            try {
                this.plugin = pluginFactory(pluginConfig);
            } catch (error) {
                this.transportInstance.broadcast(
                    BrowserProxyMessageTypes.exception,
                    error
                );
            }
        }
    }

    private registerCommandListener() {
        loggerClient.debug(
            `Browser Proxy: Register listener for messages [type = ${BrowserProxyMessageTypes.execute}]`
        );

        this.transportInstance.on(
            BrowserProxyMessageTypes.execute,
            (message) => this.onMessage(message)
        );

        process.on('exit', async () => {
            await this.plugin.kill();
        });
    }

    private async onMessage(message: IBrowserProxyMessage) {
        const { uid, applicant, command } = message;

        try {
            if (!this.plugin) {
                if (message.command.action !== BrowserProxyActions.end) {
                    throw new ReferenceError('Cannot find browser proxy plugin!');
                } else {
                    this.transportInstance.broadcast(
                        BrowserProxyMessageTypes.response,
                        { uid }
                    );

                    return;
                }
            }

            const response = await this.plugin[command.action](applicant, ...command.args);

            loggerClient.debug(
                `Browser Proxy: Send message [type=${BrowserProxyMessageTypes.response}] to parent process`
            );

            this.transportInstance.broadcast<IBrowserProxyCommandResponse>(
                BrowserProxyMessageTypes.response,
                {
                    uid,
                    response,
                    error: null
                }
            );
        } catch (error) {
            this.transportInstance.broadcast<IBrowserProxyCommandResponse>(
                BrowserProxyMessageTypes.response,
                {
                    uid,
                    error,
                    response: null
                }
            );
        }
    }
}
