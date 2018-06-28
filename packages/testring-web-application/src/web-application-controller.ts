import { EventEmitter } from 'events';
import { loggerClientLocal } from '@testring/logger';
import { ITransport, IBrowserProxyController } from '@testring/types';
import { IExecuteMessage } from './interfaces';
import { WebApplicationMessageType, WebApplicationControllerEventType } from './structs';

export class WebApplicationController extends EventEmitter {

    private onExecuteRequest = async (message: IExecuteMessage, source: string) => {
        this.emit(WebApplicationControllerEventType.execute, message);

        try {
            const response = await this.browserProxy.execute(message.command);

            this.emit(WebApplicationControllerEventType.response, response);

            await this.transport.send(source, WebApplicationMessageType.response, {
                uid: message.uid,
                response: response
            });

            this.emit(WebApplicationControllerEventType.afterResponse, message, response);
        } catch (error) {
            loggerClientLocal.error(error);

            this.emit(WebApplicationControllerEventType.error, error);

            await this.transport.send(source, WebApplicationMessageType.response, {
                uid: message.uid,
                error: error
            });
        }
    };

    constructor(
        private browserProxy: IBrowserProxyController,
        private transport: ITransport
    ) {
        super();

        this.transport.on(WebApplicationMessageType.execute, this.onExecuteRequest);
    }
}
