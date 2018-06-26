import { OptionsWithUrl } from 'request-promise';
import { Transport } from '@testring/transport';
import { HttpMessageType } from './structs';
import { Response, Request, ResponseReject } from './interfaces';
import { loggerClient } from '@testring/logger';


const nanoid = require('nanoid');

export abstract class AbstractHttpClient {
    constructor(
        protected transportInstance: Transport,
    ) {
    }
    protected abstract broadcast(options: Request): void;

    private isValidData(data: any): boolean {
        return (data !== null && data !== undefined);
    }

    private isValidRequest(request: OptionsWithUrl): boolean {
        return (this.isValidData(request) && request.hasOwnProperty('url'));
    }

    public async post(options: OptionsWithUrl): Promise<any> {
        if (!this.isValidRequest(options)) {
            loggerClient.error(`Http Client: ${options} request is not valid`);
            throw new Error('request is not valid');
        }

        return this.sendRequest(Object.assign(options, {method: 'POST'}));
    }

    public async get(options: OptionsWithUrl): Promise<any> {
        if (!this.isValidRequest(options)) {
            loggerClient.error(`Http Client: ${options} request is not valid`);
            throw new Error('request is not valid');
        }

        return this.sendRequest(Object.assign(options, {method: 'GET'}));
    }

    public async delete(options: OptionsWithUrl): Promise<any> {
        if (!this.isValidRequest(options)) {
            loggerClient.error(`Http Client: ${options} request is not valid`);
            throw new Error('request is not valid');
        }

        return this.sendRequest(Object.assign(options, {method: 'DELETE'}));
    }

    public async put(options: OptionsWithUrl): Promise<any> {
        if (!this.isValidRequest(options)) {
            loggerClient.error(`Http Client: ${options} request is not valid`);
            throw new Error('request is not valid');
        }

        return this.sendRequest(Object.assign(options, {method: 'PUT'}));
    }

    public async send(options: OptionsWithUrl, method: string): Promise<any> {
        if (!this.isValidRequest(options)) {
            loggerClient.error(`Http Client: ${options} request is not valid`);
            throw new Error('request is not valid');
        }

        return this.sendRequest(Object.assign(options, {method}));
    }

    private async sendRequest(options: OptionsWithUrl): Promise<any> {
        const requestUID = nanoid();

        return new Promise((resolve, reject) => {
            const removeResponseHandler = this.transportInstance.on(
                HttpMessageType.response,
                (response: Response) => {
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
                (response: ResponseReject) => {
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

