import { loggerClientLocal } from '@testring/logger';
import { IHttpRequest, HttpMessageType } from '@testring/types';
import { AbstractHttpClient } from './abstract-http-client';

export class HttpClientLocal extends AbstractHttpClient {
    protected broadcast(request: IHttpRequest) {
        loggerClientLocal.debug('Http client: send message inside root process', request);

        this.transportInstance.broadcastLocal(HttpMessageType.send, request);
    }
}
