import {
    IWorkerEmitter,
    TransportInternalMessageType,
    TransportMessageHandler,
    ITransportDirectMessage,
    ITransportMessage,
} from '@testring/types';
import {generateUniqId} from '@testring/utils';
import {serialize, deserialize} from './serialize';

interface PendingDelivery {
    processID: string;
    type: string;
    resolve: () => void;
    reject: (error: Error) => void;
    timer: NodeJS.Timeout;
}

const DELIVERY_TIMEOUT = 5000;

class DirectTransport {
    private static createMessageUID(processID: string) {
        return `${processID}|${generateUniqId()}`;
    }

    private childRegistry: Map<string, IWorkerEmitter> = new Map();

    private pendingDeliveries: Map<string, PendingDelivery> = new Map();

    constructor(private triggerListeners: TransportMessageHandler) {}

    public getProcessesList(): Array<string> {
        return Array.from(this.childRegistry.keys());
    }

    /**
     * Sending direct message to child process. Returns promise,
     * that resolves, when child process answers to message (like in TCP)
     */
    public send(processID: string, type: string, payload: any): Promise<void> {
        return new Promise((resolve, reject) => {
            const child = this.childRegistry.get(processID);

            if (child === undefined) {
                return reject(
                    new ReferenceError(`Process ${processID} doesn't found.`),
                );
            }

            const uid = DirectTransport.createMessageUID(processID);
            const message: ITransportDirectMessage = {
                type,
                payload: serialize(payload),
                uid,
            };

            const timer = setTimeout(() => {
                this.settleDelivery(
                    uid,
                    new Error(
                        `Message ${type} (${uid}) to ${processID} was not acknowledged within ${DELIVERY_TIMEOUT}ms`,
                    ),
                );
            }, DELIVERY_TIMEOUT);
            this.pendingDeliveries.set(uid, {
                processID,
                type,
                resolve,
                reject,
                timer,
            });

            try {
                child.send(message, (error) => {
                    if (error) {
                        this.settleDelivery(
                            uid,
                            new Error(
                                `Failed to send ${type} (${uid}) to ${processID}: ${error.message}`,
                            ),
                        );
                    }
                });
            } catch (error) {
                this.settleDelivery(
                    uid,
                    new Error(
                        `Failed to send ${type} (${uid}) to ${processID}: ${(error as Error).message}`,
                    ),
                );
            }
        });
    }

    public registerChild(processID: string, child: IWorkerEmitter) {
        if (this.childRegistry.has(processID)) {
            throw new ReferenceError(
                `Process ${processID} already exists in transport registry`,
            );
        }

        this.childRegistry.set(processID, child);

        child.on('exit', () => this.handleChildClose(processID));
        child.on('message', (message) =>
            this.handleChildMessage(message, processID),
        );
    }

    private handleChildClose(processID: string) {
        this.childRegistry.delete(processID);

        // Removing unfired handlers to avoid memory leak
        for (const [uid, delivery] of this.pendingDeliveries) {
            if (delivery.processID === processID) {
                this.settleDelivery(
                    uid,
                    new Error(
                        `Process ${processID} exited before acknowledging ${delivery.type} (${uid})`,
                    ),
                );
            }
        }
    }

    private handleChildMessage(
        message: ITransportDirectMessage,
        processID: string,
    ) {
        // incorrect message filtering
        if (!message || typeof message.type !== 'string') {
            return;
        }

        let normalizedMessage = message;

        if (message.payload && typeof message.payload.$key === 'string') {
            normalizedMessage = {
                ...message,
                payload: deserialize(message.payload),
            };
        }

        switch (message.type) {
            case TransportInternalMessageType.messageResponse:
                this.handleMessageResponse(normalizedMessage, processID);
                break;

            default:
                this.triggerListeners(normalizedMessage, processID);
        }
    }

    private handleMessageResponse(
        message: ITransportMessage<string>,
        processID: string,
    ) {
        const messageUID = message.payload;
        const delivery = this.pendingDeliveries.get(messageUID);

        if (delivery?.processID === processID) {
            this.settleDelivery(messageUID);
        }
    }

    private settleDelivery(uid: string, error?: Error) {
        const delivery = this.pendingDeliveries.get(uid);
        if (!delivery) {
            return;
        }

        this.pendingDeliveries.delete(uid);
        clearTimeout(delivery.timer);
        error ? delivery.reject(error) : delivery.resolve();
    }
}

export {DirectTransport};
