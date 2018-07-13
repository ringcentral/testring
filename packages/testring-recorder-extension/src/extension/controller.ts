import { IRecordingEvent } from '../interface';
import { MessagingTransportEvents } from '../structs';

import { MessagingTransportServer } from './messaging-transport';

export class ExtensionController {
    constructor() {
        this.registerListeners();
    }

    private server = new MessagingTransportServer();

    private mainConnectionId: string;

    private registerListeners() {
        this.server.on(
            MessagingTransportEvents.CONNECT,
            (conId) => this.handleConnection(conId),
        );

        this.server.on(
            MessagingTransportEvents.DISCONNECT,
            (conId) => this.handleDisconnection(conId),
        );

        this.server.on(
            MessagingTransportEvents.MESSAGE,
            (message) => this.handleMessage(message),
        );

        this.server.on(
            MessagingTransportEvents.RECORDING_EVENT,
            (event) => this.handleRecordingEvent(event)
        );
    }

    /*
    * Server and controller are able to handle multiple connections
    * (for example, for running multiple recording sessions),
    * but for now we limit it to first connected tab
    * */
    private handleConnection(conId: string): void {
        if (!this.mainConnectionId) {
            this.mainConnectionId = conId;
        } else {
            this.server.disconnect(conId);
        }
    }

    private handleDisconnection(conId: string): void {
        // for now do nothing, so no one can connect beyond first tab
    }

    private handleMessage(message: any): void {
        console.log(message); // eslint-disable-line
    }

    private handleRecordingEvent(event: IRecordingEvent): void {
        console.log('event:', event); // eslint-disable-line
    }
}
