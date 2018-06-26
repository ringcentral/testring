import * as process from 'process';
import { ChildProcess } from 'child_process';
import { Callback, IDirectMessage } from '../interfaces';
import { DirectTransport } from './direct-transport';
import { BroadcastTransport } from './broadcast-transport';
import { EventEmitter } from 'events';
import {loggerClient, loggerClientLocal} from '../../testring-logger/src';

type RemoveHandlerFunction = () => void;

export class Transport {

    private emitter: EventEmitter = new EventEmitter();

    private directTransport: DirectTransport;

    private broadcastTransport: BroadcastTransport;

    constructor(rootProcess: NodeJS.Process = process) {
        const handler = this.triggerListeners.bind(this);

        this.directTransport = new DirectTransport(handler);

        this.broadcastTransport = new BroadcastTransport(handler, rootProcess);
    }

    public getProcessStdioConfig(): Array<any> {
        return [null, null, null, 'ipc'];
    }

    public getProcessesList(): Array<string> {
        return this.directTransport.getProcessesList();
    }

    public send<T = any>(processID: string, messageType: string, payload: T): Promise<void> {
        loggerClient.debug(`Send message [type=${messageType}] to process [id= ${processID}]`);
        loggerClientLocal.debug(`Send message [type=${messageType}] to process [id= ${processID}]`);
        return this.directTransport.send(processID, messageType, payload);
    }

    public broadcast<T = any>(messageType: string, payload: T): void {
        loggerClient.debug(`Send message [type=${messageType}] to parent process`);
        loggerClientLocal.debug(`Send message [type = ${messageType}] to parent process`);
        this.broadcastTransport.broadcast(messageType, payload);
    }

    public broadcastLocal<T = any>(messageType: string, payload: T): void {
        loggerClient.debug(`Send local message [type = ${messageType}]`);
        loggerClientLocal.debug(`Send local message [type = ${messageType}]`);
        this.broadcastTransport.broadcastLocal(messageType, payload);
    }

    public registerChildProcess(processID: string, childProcess: ChildProcess) {
        loggerClient.debug(`Register child process [id = ${processID}]`);
        loggerClientLocal.debug(`Register child process [id = ${processID}]`);
        this.directTransport.registerChildProcess(processID, childProcess);
    }

    public on<T = any>(messageType: string, callback: Callback<T>): RemoveHandlerFunction {
        loggerClient.debug(`Register listener for messages [type = ${messageType}]`);
        loggerClientLocal.debug(`Register listener for messages [type = ${messageType}]`);
        this.emitter.on(messageType, callback);

        return () => {
            this.emitter.removeListener(messageType, callback);
        };
    }

    public once<T = any>(messageType: string, callback: Callback<T>): RemoveHandlerFunction {
        loggerClient.debug(`Register listener for one message [type = ${messageType}]`);
        loggerClientLocal.debug(`Register listener for one message [type = ${messageType}]`);
        this.emitter.once(messageType, callback);

        return () => {
            this.emitter.removeListener(messageType, callback);
        };
    }

    public onceFrom<T = any>(processID: string, messageType: string, callback: Callback<T>): RemoveHandlerFunction {
        loggerClient.debug(`Register listener for one message [type = ${messageType}] from process [id = ${processID}]`);
        loggerClientLocal.debug(`Register listener for one message [type = ${messageType}] from process [id = ${processID}]`);

        const handler = (message, source) => {
            if (processID === source) {
                callback(message);
                this.emitter.removeListener(messageType, handler);
            }
        };

        this.emitter.on(messageType, handler);

        return () => {
            this.emitter.removeListener(messageType, handler);
        };
    }

    private triggerListeners(message: IDirectMessage, source?: string) {
        loggerClient.debug(`New message [type = ${message.type}]`);
        loggerClientLocal.debug(`New message [type = ${message.type}]`);
        this.emitter.emit(message.type, message.payload, source);
    }
}
