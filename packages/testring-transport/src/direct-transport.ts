import { ChildProcess } from 'child_process';
import {
    TransportInternalMessageType,
    TransportMessageHandler,
    ITransportDirectMessage,
    ITransportMessage
} from '@testring/types';
import { serialize, deserialize } from './serialize';

const nanoid = require('nanoid');

class DirectTransport {

    private static createMessageUID(processID: string) {
        return `${processID}|${nanoid()}`;
    }

    private static isMessageFromProcess(processID: string, messageUID: string) {
        return messageUID.startsWith(processID);
    }

    private childProcessRegistry: Map<string, ChildProcess> = new Map();

    private responseHandlers: Map<string, Function> = new Map();

    constructor(private triggerListeners: TransportMessageHandler) {
    }

    public getProcessesList(): Array<string> {
        return Array.from(this.childProcessRegistry.keys());
    }

    /**
     * Sending direct message to child process. Returns promise,
     * that resolves, when child process answers to message (like in TCP)
     */
    public send(processID: string, type: string, payload: any): Promise<void> {
        return new Promise((resolve, reject) => {
            const childProcess = this.childProcessRegistry.get(processID);

            if (childProcess === undefined) {
                return reject(
                    new ReferenceError(`Process ${processID} doesn't found.`)
                );
            }

            const uid = DirectTransport.createMessageUID(processID);
            const message: ITransportDirectMessage = {
                type,
                payload: serialize(payload),
                uid
            };

            this.responseHandlers.set(uid, () => {
                this.responseHandlers.delete(uid);
                resolve();
            });

            childProcess.send(message, (error) => {
                if (error) {
                    this.responseHandlers.delete(uid);

                    reject(error);
                }
            });
        });

    }

    public registerChildProcess(processID: string, childProcess: ChildProcess) {
        if (this.childProcessRegistry.has(processID)) {
            throw new ReferenceError(
                `Process ${processID} already exists in transport registry`
            );
        }

        this.childProcessRegistry.set(processID, childProcess);

        childProcess.on('close', () => this.handleChildProcessClose(processID));
        childProcess.on('message', (message) => this.handleChildProcessMessage(message, processID));
    }

    private handleChildProcessClose(processID) {
        this.childProcessRegistry.delete(processID);

        // Removing unfired handlers to avoid memory leak
        const responseHandlers = Array.from(this.responseHandlers);

        for (const [messageUID, responseHandler] of responseHandlers) {
            if (DirectTransport.isMessageFromProcess(processID, messageUID)) {
                this.responseHandlers.delete(messageUID);

                responseHandler();
            }
        }
    }

    private handleChildProcessMessage(message: ITransportDirectMessage, processID: string) {
        // incorrect message filtering
        if (!message || typeof message.type !== 'string') {
            return;
        }

        let normalizedMessage = message;

        if (message.payload && typeof message.payload.$key === 'string') {
            normalizedMessage = {
                ...message,
                payload: deserialize(message.payload)
            };
        }

        switch (message.type) {
            case TransportInternalMessageType.messageResponse:
                this.handleMessageResponse(normalizedMessage);
                break;

            default:
                this.triggerListeners(normalizedMessage, processID);
        }
    }

    private handleMessageResponse(message: ITransportMessage<string>) {
        const messageUID = message.payload;
        const responseHandler = this.responseHandlers.get(messageUID);

        if (typeof responseHandler === 'function') {
            responseHandler();
        }
    }
}

export { DirectTransport };
