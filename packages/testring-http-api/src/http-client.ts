import { AbstractHttpClient } from './abstract-http-client';
import { HttpMessageType } from './structs';
import { Request } from './interfaces';

export class HttpClient extends AbstractHttpClient {
    protected broadcast(request: Request) {
        this.transportInstance.broadcast(HttpMessageType.send, request);
    }
}
