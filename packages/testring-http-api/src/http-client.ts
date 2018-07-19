import { loggerClient } from '@testring/logger';
import { IHttpRequestMessage, HttpMessageType } from '@testring/types';
import { AbstractHttpClient } from './abstract-http-client';

export class HttpClient extends AbstractHttpClient {
    protected broadcast(request: IHttpRequestMessage) {
        loggerClient.verbose('[http client] send message to parent process', request);

        this.transportInstance.broadcast(HttpMessageType.send, request);
    }
}
