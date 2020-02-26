import { AbstractAPI } from './abstract';
import { HttpServerPlugins, IHttpRequest, IHttpRequestMessage, IHttpResponse } from '@testring/types';

export class HttpServerAPI extends AbstractAPI {
    beforeRequest(handler: (request: IHttpRequest, data: IHttpRequestMessage) => Promise<IHttpRequest>) {
        this.registryWritePlugin(HttpServerPlugins.beforeRequest, handler);
    }
    
    beforeResponse(handler: (response: IHttpResponse, data: IHttpRequestMessage) => Promise<IHttpResponse>) {
        this.registryWritePlugin(HttpServerPlugins.beforeResponse, handler);
    }
    
    beforeError<T>(handler: (error: T, data: IHttpRequestMessage) => Promise<T>) {
        this.registryWritePlugin(HttpServerPlugins.beforeError, handler);
    }
}
