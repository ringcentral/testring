import { EventEmitter } from 'events';
import { ITransport, IBrowserProxyController } from '@testring/types';
import { IExecuteMessage, IResponseMessage } from './interfaces';
import { WebApplicationMessageType, WebApplicationControllerEventType } from './structs';

export class WebApplicationController extends EventEmitter {

    private onExecuteRequest = async (message: IExecuteMessage, source: string) => {
        this.emit(WebApplicationControllerEventType.execute, message);

        try {
            const response = await this.browserProxyController.execute(message.applicant, message.command);

            this.emit(WebApplicationControllerEventType.response, response);

            await this.transport.send<IResponseMessage>(source, WebApplicationMessageType.response, {
                uid: message.uid,
                response: response,
                error: null
            });

            this.emit(WebApplicationControllerEventType.afterResponse, message, response);
        } catch (error) {
            await this.transport.send<IResponseMessage>(source, WebApplicationMessageType.response, {
                uid: message.uid,
                response: null,
                error: error
            });
        }
    };

    constructor(
        private browserProxyController: IBrowserProxyController,
        private transport: ITransport
    ) {
        super();
    }

    public init() {
        this.transport.on(WebApplicationMessageType.execute, this.onExecuteRequest);
    }
}
