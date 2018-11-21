import { isChildProcess } from '@testring/child-process';
import { AbstractLoggerClient } from './abstract-logger-client';

export class LoggerClient extends AbstractLoggerClient {
    protected broadcast(messageType: string, payload: any) {
        if (isChildProcess()) {
            this.transportInstance.broadcast(messageType, payload);
        } else {
            this.transportInstance.broadcastLocal(messageType, payload);
        }
    }
}

export const loggerClient = new LoggerClient();
