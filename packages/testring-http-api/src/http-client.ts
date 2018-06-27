import { AbstractHttpClient } from './abstract-http-client';
import { HttpMessageType } from './structs';
import { Request } from './interfaces';
import { loggerClient } from '@testring/logger';

export class HttpClient extends AbstractHttpClient {
    protected broadcast(request: Request) {
        loggerClient.debug(`Http client: send message [type=${HttpMessageType.send}] to parent process`);
        this.transportInstance.broadcast(HttpMessageType.send, request);
    }
}
