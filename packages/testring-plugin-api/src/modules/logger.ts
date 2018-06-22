import { AbstractAPI } from './abstract';

// TODO implement, when logger will be ready

export class LoggerAPI extends AbstractAPI {

    onLog(handler: (log) => void) {
        // TODO replace string name with enum from logger
        this.registrySyncPlugin('logReceived', handler);
    }
}
