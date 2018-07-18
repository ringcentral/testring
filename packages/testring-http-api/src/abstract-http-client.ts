import { OptionsWithUrl } from 'request-promise';
import {
    ITransport,
    IHttpClient,
    HttpMessageType,
    IHttpResponse,
    IHttpRequest,
    IHttpResponseReject
} from '@testring/types';
import { loggerClient } from '@testring/logger';


const nanoid = require('nanoid');

export abstract class AbstractHttpClient implements IHttpClient {
    protected abstract broadcast(options: IHttpRequest): void;

    constructor(protected transportInstance: ITransport) {
    }

    public post(options: OptionsWithUrl): Promise<any> {
        return this.sendRequest({ ...options, method: 'POST' });
    }

    public get(options: OptionsWithUrl): Promise<any> {
        return this.sendRequest({ ...options, method: 'GET' });
    }

    public delete(options: OptionsWithUrl): Promise<any> {
        return this.sendRequest({ ...options, method: 'DELETE' });
    }

    public put(options: OptionsWithUrl): Promise<any> {
        return this.sendRequest({ ...options, method: 'PUT' });
    }

    public send(options: OptionsWithUrl): Promise<any> {
        return this.sendRequest({ ...options });
    }

    private isValidData(data: any): boolean {
        return (data !== null && data !== undefined);
    }

    private isValidRequest(request: OptionsWithUrl): boolean {
        return (this.isValidData(request) && request.hasOwnProperty('url'));
    }

    private async sendRequest(options: OptionsWithUrl): Promise<any> {
        if (!this.isValidRequest(options)) {
            loggerClient.error(`Http Client: ${options} request is not valid`);

            throw new Error('request is not valid');
        }

        const requestUID = nanoid();

        return new Promise((resolve, reject) => {
            const removeResponseHandler = this.transportInstance.on(
                HttpMessageType.response,
                (response: IHttpResponse) => {
                    if (!response.uid) {
                        loggerClient.error('Http Client: no response uid');
                        throw new Error('no uid');
                    }
                    if (response.uid === requestUID) {
                        removeResponseHandler();
                        removeRejectHandler();
                        resolve(response.response);
                    }
                }
            );

            const removeRejectHandler = this.transportInstance.on(
                HttpMessageType.reject,
                (response: IHttpResponseReject) => {
                    if (!response.uid) {
                        loggerClient.error('Http Client: no response uid');
                        throw new Error('no uid');
                    }

                    if (response.uid === requestUID) {
                        removeRejectHandler();
                        removeResponseHandler();
                        loggerClient.error(`Http Client: failed with error ${response.error}`);

                        reject(response.error);
                    }
                }
            );

            this.broadcast({
                uid: requestUID,
                request: options
            });
        });
    }
}

