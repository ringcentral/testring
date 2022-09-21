import {IHttpRequestMessage, HttpMessageType} from '@testring/types';
import {AbstractHttpClient} from './abstract-http-client';

export class HttpClient extends AbstractHttpClient {
    protected broadcast(request: IHttpRequestMessage) {
        if (this.transportInstance.isChildProcess()) {
            this.loggerClient.verbose(
                'send message to parent process',
                request,
            );
        } else {
            this.loggerClient.verbose(
                'send message inside root process',
                request,
            );
        }

        this.transportInstance.broadcastUniversally(
            HttpMessageType.send,
            request,
        );
    }
}
