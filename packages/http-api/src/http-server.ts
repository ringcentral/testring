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
import {safeUrl} from './safe-url';

type MakeRequest = (request: IHttpRequest) => Promise<IHttpResponse>;
type DeliveryPhase = 'serialize' | 'send' | 'ack';

class HttpResponseDeliveryError extends Error {
    constructor(
        public phase: DeliveryPhase,
        public attempt: string,
        message: string,
    ) {
        super(message);
    }
}

function getDeliveryPhase(error: unknown): DeliveryPhase {
    const message = error instanceof Error ? error.message : '';
    if (/values are not supported|symbol keys are not supported/i.test(message)) {
        return 'serialize';
    }
    if (/acknowledg|not acknowledged/i.test(message)) {
        return 'ack';
    }
    return 'send';
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

export class HttpServer
    extends PluggableModule
    implements IHttpServerController
{
    private unsubscribeTransport: Function;

    private logger: LoggerClient = loggerClient.withPrefix('[http-server]');

    private isKilled = false;

    private log(level: 'debug' | 'warn' | 'error', ...args: any[]) {
        try {
            this.logger[level](...args);
        } catch {
            // Diagnostics must not change HTTP request or reply delivery.
        }
    }

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
            const context = {
                uid,
                source: rSrc,
                method: request?.method || 'GET',
                url: safeUrl(request?.url || ''),
            };

            try {
                this.log('debug', 'HTTP request started', {
                    event: 'http_request_started',
                    ...context,
                    messageType: HttpMessageType.send,
                });
                this.log('debug', 'Sending HTTP request', context);

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

                const responseAfterHook = await this.callHook(
                    HttpServerPlugins.beforeResponse,
                    response,
                    rData,
                    requestAfterHook,
                );

                this.log('debug', 'HTTP request completed', {
                    event: 'http_request_completed',
                    ...context,
                    messageType: HttpMessageType.response,
                });

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
                    err.attempt === 'response'
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
                const requestFailure = {
                    name: portableError.name,
                    statusCode: (portableError as any).statusCode,
                    code: (portableError as any).code,
                };
                this.log('warn', 'HTTP request rejected', {
                    event: 'http_request_rejected',
                    ...context,
                    messageType: HttpMessageType.reject,
                    requestFailure,
                });
                try {
                    await this.sendResponse<IHttpResponseRejectMessage>(
                        rSrc,
                        HttpMessageType.reject,
                        {uid, error: portableError},
                        'reject',
                        request,
                        requestFailure,
                    );
                } catch (deliveryError) {
                    await this.sendFallbackRejection(
                        rSrc,
                        uid,
                        request,
                        deliveryError,
                        requestFailure,
                    );
                }
            }
        };

        setImmediate(() =>
            send(data, src).catch(() =>
                this.log('error', 'HTTP request handler failed', {
                    event: 'http_request_handler_failed',
                    uid: data.uid,
                    source: src,
                    method: data.request?.method || 'GET',
                    url: safeUrl(data.request?.url || ''),
                }),
            ),
        );
    }

    private async sendResponse<T>(
        source: string | undefined | null,
        messageType: string,
        payload: T,
        phase: string,
        request: IHttpRequest,
        requestFailure?: Record<string, any>,
    ) {
        if (!source) {
            this.transportInstance.broadcastLocal<T>(messageType, payload);
        } else {
            try {
                await this.transportInstance.send<T>(
                    source,
                    messageType,
                    payload,
                );
            } catch (err: unknown) {
                const errorName = err instanceof Error ? err.name : typeof err;
                const failurePhase = getDeliveryPhase(err);
                const uid = (payload as any)?.uid;
                this.log('error', 'HTTP response delivery failed', {
                    event: 'http_reply_delivery_failed',
                    uid,
                    source,
                    method: request?.method || 'GET',
                    url: safeUrl(request?.url || ''),
                    phase: failurePhase,
                    attempt: phase,
                    messageType,
                    requestFailure,
                    deliveryFailure: {name: errorName},
                });
                throw new HttpResponseDeliveryError(
                    failurePhase,
                    phase,
                    errorName,
                );
            }
        }
        this.log('debug', 'HTTP reply sent', {
            event: 'http_reply_sent',
            uid: (payload as any)?.uid,
            source,
            method: request?.method || 'GET',
            url: safeUrl(request?.url || ''),
            messageType,
            attempt: phase,
            requestFailure,
        });
    }

    private async sendFallbackRejection(
        source: string | undefined | null,
        uid: string,
        request: IHttpRequest,
        deliveryError: unknown,
        requestFailure?: Record<string, any>,
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
                requestFailure,
            );
        } catch (fallbackError) {
            const failurePhase = getDeliveryPhase(fallbackError);
            this.log('error', 'HTTP response delivery failed permanently', {
                event: 'http_reply_delivery_terminal_failure',
                uid,
                source,
                method: request?.method || 'GET',
                url: safeUrl(request?.url || ''),
                phase: failurePhase,
                attempt: 'fallback',
                messageType: HttpMessageType.reject,
                requestFailure,
                deliveryFailure: {
                    name:
                        fallbackError instanceof Error
                            ? fallbackError.name
                            : typeof fallbackError,
                    previousPhase:
                        deliveryError instanceof HttpResponseDeliveryError
                            ? deliveryError.phase
                            : getDeliveryPhase(deliveryError),
                },
            });
        }
    }
}
