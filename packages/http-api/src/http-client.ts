import {IHttpRequestMessage, HttpMessageType} from '@testring/types';
import {AbstractHttpClient} from './abstract-http-client';
import {safeUrl} from './safe-url';

export class HttpClient extends AbstractHttpClient {
    protected broadcast(request: IHttpRequestMessage) {
        if (this.transportInstance.isChildProcess()) {
            this.log(
                'debug',
                'send message to parent process',
                {
                    uid: request.uid,
                    method: request.request.method || 'GET',
                    url: safeUrl(request.request.url),
                },
            );
        } else {
            this.log(
                'debug',
                'send message inside root process',
                {
                    uid: request.uid,
                    method: request.request.method || 'GET',
                    url: safeUrl(request.request.url),
                },
            );
        }

        this.transportInstance.broadcastUniversally(
            HttpMessageType.send,
            request,
        );
    }
}
