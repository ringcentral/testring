import {
    BrowserProxyActions,
    BrowserProxyMessageTypes,
    IBrowserProxyCommandResponse,
    IBrowserProxyMessage,
    IBrowserProxyPlugin,
    ITransport,
} from '@testring/types';
import {requirePlugin} from '@testring/utils';
import {loggerClient} from '@testring/logger';

function resolvePlugin(pluginPath: string): IBrowserProxyPlugin {
    const resolvedPlugin = requirePlugin(pluginPath);

    if (typeof resolvedPlugin !== 'function') {
        throw new TypeError('plugin is not a function');
    }

    return resolvedPlugin;
}

export class BrowserProxy {
    private plugin: IBrowserProxyPlugin;

    private killed = false;

    private logger = loggerClient.withPrefix('[browser-proxy]');

    public removeHandlers: Array<() => void> = [];

    constructor(
        private transportInstance: ITransport,
        pluginPath: string,
        pluginConfig: any,
    ) {
        this.loadPlugin(pluginPath, pluginConfig);
        this.registerCommandListener();
    }

    private loadPlugin(pluginPath: string, pluginConfig: any) {
        let pluginFactory;

        try {
            pluginFactory = resolvePlugin(pluginPath);
        } catch (error) {
            this.logger.error(`Can't load plugin ${pluginPath}`, error);
        }

        if (pluginFactory) {
            try {
                this.plugin = pluginFactory(pluginConfig);
            } catch (error) {
                this.transportInstance.broadcastUniversally(
                    BrowserProxyMessageTypes.exception,
                    error,
                );
            }
        }
    }

    private registerCommandListener() {
        this.removeHandlers.push(this.transportInstance.on(BrowserProxyMessageTypes.execute, (message) =>
            this.onMessage(message),
        ));
    }

    private sendEmptyResponse(uid: string) {
        this.transportInstance.broadcastUniversally(BrowserProxyMessageTypes.response, {
            uid,
        });
    }

    private async onMessage(message: IBrowserProxyMessage) {
        const {uid, applicant, command} = message;

        try {
            if (this.killed) {
                this.sendEmptyResponse(uid);
                return;
            }

            if (!this.plugin) {
                if (
                    command.action === BrowserProxyActions.end ||
                    command.action === BrowserProxyActions.kill
                ) {
                    this.sendEmptyResponse(uid);
                    return;
                }
                throw new ReferenceError('Cannot find browser proxy plugin!');
            }

            if (command.action === BrowserProxyActions.kill) {
                this.killed = true;
            }

            const response = await this.plugin[command.action](
                applicant,
                ...command.args,
            );

            this.transportInstance.broadcastUniversally<IBrowserProxyCommandResponse>(
                BrowserProxyMessageTypes.response,
                {
                    uid,
                    response,
                    error: null,
                },
            );
        } catch (error) {
            this.transportInstance.broadcastUniversally<IBrowserProxyCommandResponse>(
                BrowserProxyMessageTypes.response,
                {
                    uid,
                    error,
                    response: null,
                },
            );
        }
    }
}
