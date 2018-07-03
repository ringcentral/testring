import { AbstractAPI } from './abstract';
import { LoggerPlugins } from '@testring/types';

export class LoggerAPI extends AbstractAPI {

    beforeLog(handler: (log) => void) {
        this.registrySyncPlugin(LoggerPlugins.beforeLog, handler);
    }

    onLog(handler: (log) => void) {
        this.registrySyncPlugin(LoggerPlugins.onLog, handler);
    }

    onError(handler: (log) => void) {
        this.registrySyncPlugin(LoggerPlugins.onError, handler);
    }
}
