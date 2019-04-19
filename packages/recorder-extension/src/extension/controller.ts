// import {
//     ClientWsTransportEvents,
//     IRecordingEvent,
//     ExtensionMessagingTransportEvents,
//     RecorderEvents,
// } from '@testring/types';
// import { ClientWsTransport } from '@testring/client-ws-transport';
// import { Queue } from '@testring/utils';
//
// import { MessagingTransportServer } from './messaging-transport';
//
// export class ExtensionController {
//
//     constructor() {
//         this.registerMessagingListeners();
//         this.registerWsListeners();
//         this.registerContextMenu();
//     }
//
//     private messagingServer = new MessagingTransportServer();
//
//     private wsTransport = new ClientWsTransport();
//
//     private mainConnectionId: string;
//
//     private wsMessagesQueue = new Queue<string>();
//
//     private registerContextMenu() {
//         // chrome.contextMenus.create({
//         //     id: 'equalText',
//         //     title: 'Equal text',
//         //     contexts: ['all'],
//         // });
//         //
//         // chrome.contextMenus.onClicked.addListener((clickData) => {
//         //     this.messagingServer.send(
//         //         this.mainConnectionId,
//         //         { event: ExtensionMessagingTransportEvents.RECORDING_EVENT, payload: clickData }
//         //     );
//         // });
//     }
//
//     private registerMessagingListeners() {
//         this.messagingServer.on(
//             ExtensionMessagingTransportEvents.CONNECT,
//             (conId) => this.handleClientConnection(conId),
//         );
//
//         this.messagingServer.on(
//             ExtensionMessagingTransportEvents.DISCONNECT,
//             (conId) => this.handleClientDisconnection(conId),
//         );
//
//         this.messagingServer.on(
//             ExtensionMessagingTransportEvents.MESSAGE,
//             (message) => this.handleClientMessage(message),
//         );
//
//         this.messagingServer.on(
//             ExtensionMessagingTransportEvents.RECORDING_EVENT,
//             (event) => this.handleRecordingEvent(event)
//         );
//     }
//
//     private registerWsListeners() {
//         this.wsTransport.on(
//             ClientWsTransportEvents.MESSAGE,
//             (message) => this.handleWsMessage(message),
//         );
//
//         this.wsTransport.connect();
//     }
//
//     /*
//     * Server and controller are able to handle multiple connections
//     * (for example, for running multiple recording sessions),
//     * but for now we limit it to first connected tab
//     * */
//     private handleClientConnection(conId: string): void {
//         if (!this.mainConnectionId) {
//             this.mainConnectionId = conId;
//
//             this.flushWsMessageQueue();
//         } else {
//             this.messagingServer.disconnect(conId);
//         }
//     }
//
//     private handleClientDisconnection(conId: string): void {
//         // for now do nothing, so no one can connect beyond first tab
//     }
//
//     private handleClientMessage(message: any): void {
//         console.log(message); // eslint-disable-line
//     }
//
//     private handleWsMessage(message: string): void {
//         if (this.mainConnectionId) {
//             this.sendMessage(message);
//         } else {
//             this.wsMessagesQueue.push(message);
//         }
//     }
//
//     private handleRecordingEvent(event: IRecordingEvent): void {
//         this.wsTransport.send(
//             RecorderEvents.RECORDING,
//             event,
//         );
//     }
//
//     private sendMessage(message: string): void {
//         try {
//             const { event, payload } = JSON.parse(message);
//
//             if (event) {
//                 this.messagingServer.send(
//                     this.mainConnectionId,
//                     { event, payload },
//                 );
//             } else {
//                 throw new Error('No event data found in message data');
//             }
//         } catch (e) {
//             console.warn(e); // eslint-disable-line
//
//             this.messagingServer.send(
//                 this.mainConnectionId,
//                 {
//                     event: ExtensionMessagingTransportEvents.MESSAGE,
//                     payload: message,
//                 }
//             );
//         }
//     }
//
//     private flushWsMessageQueue() {
//         const message = this.wsMessagesQueue.getFirstElement();
//
//         if (message) {
//             this.sendMessage(message);
//
//             this.wsMessagesQueue.shift();
//
//             if (this.wsMessagesQueue.length > 0) {
//                 this.flushWsMessageQueue();
//             }
//         }
//     }
// }
