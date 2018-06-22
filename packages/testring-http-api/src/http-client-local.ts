import { AbstractHttpClient } from './abstract-http-client';
import { HttpMessageType } from './structs';
import { Request } from './interfaces';

export class HttpClientLocal extends AbstractHttpClient {
    protected broadcast(request: Request) {
        this.transportInstance.broadcastLocal(HttpMessageType.send, request);
    }
}
