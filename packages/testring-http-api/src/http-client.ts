import { loggerClient } from '@testring/logger';
import { IHttpRequest, HttpMessageType } from '@testring/types';
import { AbstractHttpClient } from './abstract-http-client';

export class HttpClient extends AbstractHttpClient {
    protected broadcast(request: IHttpRequest) {
        loggerClient.debug('Http client: send message to parent process', request);

        this.transportInstance.broadcast(HttpMessageType.send, request);
    }
}
