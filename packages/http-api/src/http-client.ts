import { isChildProcess } from '@testring/child-process';
import { loggerClient } from '@testring/logger';
import { IHttpRequestMessage, HttpMessageType } from '@testring/types';
import { AbstractHttpClient } from './abstract-http-client';

const logger = loggerClient.withPrefix('[http client]');

export class HttpClient extends AbstractHttpClient {
    protected broadcast(request: IHttpRequestMessage) {
        if (isChildProcess()) {
            logger.verbose('send message to parent process', request);

            this.transportInstance.broadcast(HttpMessageType.send, request);
        } else {
            logger.verbose('send message inside root process', request);

            this.transportInstance.broadcastLocal(HttpMessageType.send, request);
        }
    }
}
