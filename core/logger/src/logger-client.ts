import { AbstractLoggerClient } from './abstract-logger-client';

export class LoggerClient extends AbstractLoggerClient {
    protected broadcast(messageType: string, payload: any) {
        this.transportInstance.broadcastUniversally(messageType, payload);
    }
}

export const loggerClient = new LoggerClient();
