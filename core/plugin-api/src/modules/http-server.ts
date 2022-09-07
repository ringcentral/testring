import {AbstractAPI} from './abstract';
import {
    HttpServerPlugins,
    IHttpRequest,
    IHttpRequestMessage,
    IHttpResponse,
} from '@testring-dev/types';

export class HttpServerAPI extends AbstractAPI {
    beforeRequest(
        handler: (
            request: IHttpRequest,
            data: IHttpRequestMessage,
        ) => Promise<IHttpRequest>,
    ) {
        this.registryWritePlugin(HttpServerPlugins.beforeRequest, handler);
    }

    beforeResponse(
        handler: (
            response: IHttpResponse,
            data: IHttpRequestMessage,
            request: IHttpRequest,
        ) => Promise<IHttpResponse>,
    ) {
        this.registryWritePlugin(HttpServerPlugins.beforeResponse, handler);
    }

    beforeError<T>(
        handler: (
            error: T,
            data: IHttpRequestMessage,
            request: IHttpRequest,
        ) => Promise<T>,
    ) {
        this.registryWritePlugin(HttpServerPlugins.beforeError, handler);
    }
}
