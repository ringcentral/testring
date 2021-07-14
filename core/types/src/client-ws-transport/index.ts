import { ClientWsTransportEvents } from '../devtool-extension/enums';
import { IDevtoolWSMessage } from '../devtool-backend';
import EventEmitter = NodeJS.EventEmitter;

export interface IClientWsTransport extends EventEmitter {
    addListener(event: ClientWsTransportEvents.OPEN, listener: (arg: void) => void): this;
    addListener(event: ClientWsTransportEvents.MESSAGE, listener: (arg: IDevtoolWSMessage) => void): this;
    addListener(event: ClientWsTransportEvents.CLOSE, listener: (arg: void) => void): this;
    addListener(event: ClientWsTransportEvents.ERROR, listener: (arg: Error) => void): this;

    on(event: ClientWsTransportEvents.OPEN, listener: (arg: void) => void): this;
    on(event: ClientWsTransportEvents.MESSAGE, listener: (arg: IDevtoolWSMessage) => void): this;
    on(event: ClientWsTransportEvents.CLOSE, listener: (arg: void) => void): this;
    on(event: ClientWsTransportEvents.ERROR, listener: (arg: Error) => void): this;

    removeListener(event: ClientWsTransportEvents, listener: (...args: any[]) => void): this;
    off(event: ClientWsTransportEvents, listener: (...args: any[]) => void): this;

    send(event: IDevtoolWSMessage['type'], payload: IDevtoolWSMessage['payload']): Promise<void>;
}
