import {
    IHttpRequest,
    IHttpResponse,
    IHttpServerController,
    ITransport,
    IHttpRequestMessage,
    IHttpResponseMessage,
    IHttpResponseRejectMessage,
    HttpMessageType,
    HttpServerPlugins,
} from '@testring/types';
import {PluggableModule} from '@testring/pluggable-module';
import {LoggerClient, loggerClient} from '@testring/logger';

type MakeRequest = (request: IHttpRequest) => Promise<IHttpResponse>;

class HttpResponseDeliveryError extends Error {
    constructor(public phase: string, message: string) {
        super(message);
    }
}

function portableValue(value: any, ancestors = new Set<any>()): any {
    if (
        value === null ||
        value === undefined ||
        ['string', 'number', 'boolean'].includes(typeof value)
    ) {
        return value;
    }
    if (ancestors.has(value)) {
        return undefined;
    }
    if (Array.isArray(value)) {
        ancestors.add(value);
        const result = value.map((item) => portableValue(item, ancestors));
        ancestors.delete(value);
        return result;
    }
    if (typeof value !== 'object') {
        return undefined;
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
        return undefined;
    }

    ancestors.add(value);
    const result: Record<string, any> = {};
    for (const [key, item] of Object.entries(value)) {
        const portable = portableValue(item, ancestors);
        if (portable !== undefined) {
            result[key] = portable;
        }
    }
    ancestors.delete(value);
    return result;
}

function normalizeHttpError(error: any): Error {
    const normalized = new Error(
        typeof error?.message === 'string' ? error.message : String(error),
    );
    normalized.name =
        typeof error?.name === 'string' ? error.name : 'Error';

    const statusCode = error?.statusCode ?? error?.response?.statusCode;
    if (Number.isFinite(statusCode)) {
        (normalized as any).statusCode = statusCode;
    }

    const responseBody = error?.response?.body ?? error?.error;
    const portableBody = portableValue(responseBody);
    if (portableBody !== undefined) {
        (normalized as any).responseBody = portableBody;
    }

    return normalized;
}

function safeUrl(request: IHttpRequest): string {
    try {
        const url = new URL(request.url);
        return `${url.origin}${url.pathname}`;
    } catch {
        return (
            request.url
                .split(/[?#]/, 1)[0]
                ?.replace(
                    /^([a-z][a-z\d+.-]*:\/\/)[^/]*@/i,
                    '$1',
                ) || ''
        );
    }
}

export class HttpServer
    extends PluggableModule
    implements IHttpServerController
{
    private unsubscribeTransport: Function;

    private logger: LoggerClient = loggerClient.withPrefix('[http-server]');

    private isKilled = false;

    constructor(
        private transportInstance: ITransport,
        private request: MakeRequest,
    ) {
        super([
            HttpServerPlugins.beforeResponse,
            HttpServerPlugins.beforeRequest,
            HttpServerPlugins.beforeError,
        ]);

        this.unsubscribeTransport = this.transportInstance.on(
            HttpMessageType.send,
            (data: IHttpRequestMessage, src?: string) => {
                if (this.isKilled) {
                    return;
                }

                this.makeRequest(data, src);
            },
        );
    }

    public kill() {
        this.isKilled = true;
        this.unsubscribeTransport();
    }

    private makeRequest(data: IHttpRequestMessage, src?: string): void {
        if (this.isKilled) {
            return;
        }

        const send = async (rData: IHttpRequestMessage, rSrc?: string) => {
            const uid: string = rData.uid;
            const request = rData.request;

            try {
                this.logger.verbose(`Sending http request to ${request.url}`);

                const requestAfterHook = await this.callHook(
                    HttpServerPlugins.beforeRequest,
                    request,
                    rData,
                );
                const response = await this.request(requestAfterHook);

                if (response.statusCode >= 400) {
                    throw new Error(response.statusMessage);
                }

                if (this.isKilled) {
                    return;
                }

                this.logger.verbose(`Successful response form ${request.url}`);

                const responseAfterHook = await this.callHook(
                    HttpServerPlugins.beforeResponse,
                    response,
                    rData,
                    requestAfterHook,
                );

                await this.sendResponse<IHttpResponseMessage>(
                    rSrc,
                    HttpMessageType.response,
                    {
                        uid,
                        response: responseAfterHook,
                    },
                    'response',
                    request,
                );
            } catch (err: unknown) {
                if (this.isKilled) {
                    return;
                }

                if (
                    err instanceof HttpResponseDeliveryError &&
                    err.phase === 'response'
                ) {
                    await this.sendFallbackRejection(
                        rSrc,
                        uid,
                        request,
                        err,
                    );
                    return;
                }

                const errorAfterHook = await this.callHook(
                    HttpServerPlugins.beforeError,
                    err,
                    rData,
                    request,
                );

                const portableError = normalizeHttpError(errorAfterHook);
                try {
                    await this.sendResponse<IHttpResponseRejectMessage>(
                        rSrc,
                        HttpMessageType.reject,
                        {uid, error: portableError},
                        'reject',
                        request,
                    );
                    this.logger.debug(
                        `Request failed ${portableError.name} - ${portableError.message}`,
                    );
                } catch (deliveryError) {
                    await this.sendFallbackRejection(
                        rSrc,
                        uid,
                        request,
                        deliveryError,
                    );
                }
            }
        };

        setImmediate(() =>
            send(data, src).catch((err) => this.logger.error(err)),
        );
    }

    private async sendResponse<T>(
        source: string | undefined | null,
        messageType: string,
        payload: T,
        phase: string,
        request: IHttpRequest,
    ) {
        try {
            if (source) {
                await this.transportInstance.send<T>(
                    source,
                    messageType,
                    payload,
                );
            } else {
                this.transportInstance.broadcastLocal<T>(messageType, payload);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.name : typeof err;
            const uid = (payload as any)?.uid;
            this.logger.error('HTTP response delivery failed', {
                uid,
                source,
                method: request.method || 'GET',
                url: safeUrl(request),
                phase,
                messageType,
                error: errorMessage,
            });
            throw new HttpResponseDeliveryError(phase, errorMessage);
        }
    }

    private async sendFallbackRejection(
        source: string | undefined | null,
        uid: string,
        request: IHttpRequest,
        deliveryError: unknown,
    ) {
        try {
            await this.sendResponse<IHttpResponseRejectMessage>(
                source,
                HttpMessageType.reject,
                {
                    uid,
                    error: new Error('HTTP response could not be delivered'),
                },
                'fallback',
                request,
            );
        } catch (fallbackError) {
            this.logger.error('HTTP response delivery failed permanently', {
                uid,
                source,
                method: request.method || 'GET',
                url: safeUrl(request),
                phase: 'terminal',
                error:
                    fallbackError instanceof Error
                        ? fallbackError.name
                        : typeof fallbackError,
                previousError:
                    deliveryError instanceof Error
                        ? deliveryError.name
                        : typeof deliveryError,
            });
        }
    }
}
