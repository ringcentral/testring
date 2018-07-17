import {ClientWsTransportEvents, IRecordingEvent, MessagingTransportEvents, RecorderEvents} from '@testring/types';
import { ClientWsTransport } from '@testring/client-ws-transport';

import { MessagingTransportServer } from './messaging-transport';

export class ExtensionController {

    constructor() {
        this.registerMessagingListeners();
        this.registerWsListeners();
    }

    private messagingServer = new MessagingTransportServer();

    private wsTransport = new ClientWsTransport();

    private mainConnectionId: string;

    private wsMessagesQueue: Array<string> = [];

    private registerMessagingListeners() {
        this.messagingServer.on(
            MessagingTransportEvents.CONNECT,
            (conId) => this.handleClientConnection(conId),
        );

        this.messagingServer.on(
            MessagingTransportEvents.DISCONNECT,
            (conId) => this.handleClientDisconnection(conId),
        );

        this.messagingServer.on(
            MessagingTransportEvents.MESSAGE,
            (message) => this.handleClientMessage(message),
        );

        this.messagingServer.on(
            MessagingTransportEvents.RECORDING_EVENT,
            (event) => this.handleRecordingEvent(event)
        );
    }

    private registerWsListeners() {
        this.wsTransport.connect();

        this.wsTransport.on(
            ClientWsTransportEvents.MESSAGE,
            (message) => this.handleWsMessage(message),
        );
    }

    /*
    * Server and controller are able to handle multiple connections
    * (for example, for running multiple recording sessions),
    * but for now we limit it to first connected tab
    * */
    private handleClientConnection(conId: string): void {
        if (!this.mainConnectionId) {
            this.mainConnectionId = conId;

            this.flushWsMessageQueue();
        } else {
            this.messagingServer.disconnect(conId);
        }
    }

    private handleClientDisconnection(conId: string): void {
        // for now do nothing, so no one can connect beyond first tab
    }

    private handleClientMessage(message: any): void {
        console.log(message); // eslint-disable-line
    }

    private handleWsMessage(message: string): void {
        if (this.mainConnectionId) {
            this.sendMessage(message);
        } else {
            this.wsMessagesQueue.push(message);
        }
    }

    private flushWsMessageQueue() {
        const message = this.wsMessagesQueue[0];

        if (message) {
            this.sendMessage(message);

            this.wsMessagesQueue.shift();

            if (this.wsMessagesQueue.length > 0) {
                this.flushWsMessageQueue();
            }
        }
    }

    private handleRecordingEvent(event: IRecordingEvent): void {
        this.wsTransport.send(
            RecorderEvents.RECORDING,
            event,
        );
    }

    private sendMessage(message: string): void {
        try {
            const { event, payload } = JSON.parse(message);

            if (event) {
                this.messagingServer.send(
                    this.mainConnectionId,
                    { event, payload },
                );
            } else {
                throw new Error('No event data found in message data');
            }
        } catch (e) {
            console.warn(e); // eslint-disable-line

            this.messagingServer.send(
                this.mainConnectionId,
                {
                    event: MessagingTransportEvents.MESSAGE,
                    payload: message
                }
            );
        }
    }
}
