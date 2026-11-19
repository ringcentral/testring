import {
    BrowserProxyActions,
    BrowserProxyMessageTypes,
    IBrowserProxyCommandResponse,
    IBrowserProxyMessage,
    IBrowserProxyPlugin,
    ITransport,
} from '@testring/types';
import {addErrorDetails, requirePlugin} from '@testring/utils';
import {loggerClient} from '@testring/logger';

function normalizeErrorForTransport(value: unknown): Error {
    if (!(value instanceof Error)) {
        return new Error(String(value));
    }

    const error = new Error(value.message);
    error.name = value.name;
    if (typeof value.stack === 'string') {
        error.stack = value.stack;
    }

    const source = value as Error & {
        code?: unknown;
        details?: unknown;
        statusCode?: unknown;
        url?: unknown;
    };
    if (typeof source.code === 'string') {
        (error as Error & {code?: string}).code = source.code;
    }

    const details: Record<string, unknown> =
        source.details &&
        typeof source.details === 'object' &&
        !Array.isArray(source.details)
            ? {...source.details}
            : {};
    if (typeof source['url'] === 'string' || source['url'] instanceof URL) {
        details['url'] = source['url'];
    }
    if (
        typeof source['statusCode'] === 'number' &&
        Number.isFinite(source['statusCode'])
    ) {
        details['statusCode'] = source['statusCode'];
    }
    if (Object.keys(details).length) {
        addErrorDetails(error, details);
    }

    if (Object.prototype.hasOwnProperty.call(value, 'cause')) {
        Object.defineProperty(error, 'cause', {
            value: (value as Error & {cause?: unknown}).cause,
            configurable: true,
            writable: true,
        });
    }

    return error;
}

function resolvePlugin(pluginPath: string): IBrowserProxyPlugin {
    const resolvedPlugin = requirePlugin(pluginPath);

    if (typeof resolvedPlugin !== 'function') {
        throw new TypeError('plugin is not a function');
    }

    return resolvedPlugin;
}

export class BrowserProxy {
    private plugin: IBrowserProxyPlugin | undefined;

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
        let pluginFactory: any;

        try {
            pluginFactory = resolvePlugin(pluginPath);
        } catch (error) {
            this.logger.error(`Can't load plugin ${pluginPath}`, error);
        }

        if (pluginFactory) {
            try {
                this.plugin = pluginFactory(pluginConfig);
            } catch (error) {
                this.logger.error(`Can't initialize plugin ${pluginPath}`, error);
                this.transportInstance.broadcastUniversally(
                    BrowserProxyMessageTypes.exception,
                    normalizeErrorForTransport(error),
                );
            }
        }
    }

    private registerCommandListener() {
        this.removeHandlers.push(
            this.transportInstance.on(
                BrowserProxyMessageTypes.execute,
                (message) => this.onMessage(message),
            ),
        );
    }

    private sendEmptyResponse(uid: string) {
        this.transportInstance.broadcastUniversally(
            BrowserProxyMessageTypes.response,
            {
                uid,
            },
        );
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

            const method = (this.plugin as any)[command.action];
            const response = await method.call(this.plugin, applicant, ...command.args);

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
                    error: normalizeErrorForTransport(error),
                    response: null,
                },
            );
        }
    }
}
