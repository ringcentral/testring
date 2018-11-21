import { loggerClient } from '@testring/logger';
import { IHttpRequestMessage, HttpMessageType } from '@testring/types';
import { AbstractHttpClient } from './abstract-http-client';

export class HttpClientLocal extends AbstractHttpClient {
    protected broadcast(request: IHttpRequestMessage) {
        loggerClient.verbose('[http client] send message inside root process', request);

        this.transportInstance.broadcastLocal(HttpMessageType.send, request);
    }
}
