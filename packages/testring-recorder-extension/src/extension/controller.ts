import { MessagingTransportServer } from '../messaging-transport';
import { MessagingTransportEvents } from '../structs';

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
        if (conId === this.mainConnectionId) {
            delete this.mainConnectionId;
        }
    }

    private handleMessage(message: any): void {
        console.log(message); // eslint-disable-line
    }
}
