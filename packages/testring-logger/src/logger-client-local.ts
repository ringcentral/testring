import { AbstractLoggerClient } from './abstract-logger-client';

export class LoggerClientLocal extends AbstractLoggerClient {
    protected broadcast(messageType: string, payload: any) {
        this.transportInstance.broadcastLocal(messageType, payload);
    }
}

export const loggerClientLocal = new LoggerClientLocal();
