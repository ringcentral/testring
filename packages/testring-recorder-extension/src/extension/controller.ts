import { IRecordingEvent, MessagingTransportEvents, RecorderEvents } from '@testring/types';
import { ClientWsTransport } from '@testring/client-ws-transport';

import { MessagingTransportServer } from './messaging-transport';

export class ExtensionController {

    constructor() {
        this.registerMessagingListeners();
        this.wsTransport.connect();
    }

    private messagingServer = new MessagingTransportServer();

    private wsTransport = new ClientWsTransport();

    private mainConnectionId: string;

    private registerMessagingListeners() {
        this.messagingServer.on(
            MessagingTransportEvents.CONNECT,
            (conId) => this.handleConnection(conId),
        );

        this.messagingServer.on(
            MessagingTransportEvents.DISCONNECT,
            (conId) => this.handleDisconnection(conId),
        );

        this.messagingServer.on(
            MessagingTransportEvents.MESSAGE,
            (message) => this.handleMessage(message),
        );

        this.messagingServer.on(
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
            this.messagingServer.disconnect(conId);
        }
    }

    private handleDisconnection(conId: string): void {
        // for now do nothing, so no one can connect beyond first tab
    }

    private handleMessage(message: any): void {
        console.log(message); // eslint-disable-line
    }

    private handleRecordingEvent(event: IRecordingEvent): void {
        this.wsTransport.send(
            RecorderEvents.RECORDING,
            event,
        );
    }
}
