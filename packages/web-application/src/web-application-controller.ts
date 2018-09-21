import { EventEmitter } from 'events';
import {
    ITransport,
    IBrowserProxyController,
    IWebApplicationExecuteMessage,
    IWebApplicationResponseMessage,
    WebApplicationMessageType,
    WebApplicationControllerEventType
} from '@testring/types';

export class WebApplicationController extends EventEmitter {

    private isKilled = false;

    private onExecuteRequest = async (message: IWebApplicationExecuteMessage, source: string) => {
        this.emit(WebApplicationControllerEventType.execute, message);

        try {
            const response = await this.browserProxyController.execute(message.applicant, message.command);

            if (this.isKilled) {
                return;
            }

            this.emit(WebApplicationControllerEventType.response, response);

            await this.transport.send<IWebApplicationResponseMessage>(source, WebApplicationMessageType.response, {
                uid: message.uid,
                response: response,
                error: null
            });

            this.emit(WebApplicationControllerEventType.afterResponse, message, response);
        } catch (error) {
            if (this.isKilled) {
                return;
            }

            await this.transport.send<IWebApplicationResponseMessage>(source, WebApplicationMessageType.response, {
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

    public kill() {
        this.isKilled = true;
    }
}
