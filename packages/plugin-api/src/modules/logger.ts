import { AbstractAPI } from './abstract';
import { ILogEntity, ILogMeta, LoggerPlugins } from '@testring/types';

export class LoggerAPI extends AbstractAPI {

    beforeLog(handler: (logEntity: ILogEntity, meta: ILogMeta) => ILogEntity) {
        this.registryWritePlugin(LoggerPlugins.beforeLog, handler);
    }

    onLog(handler: (logEntity: ILogEntity, meta: ILogMeta) => void) {
        this.registryReadPlugin(LoggerPlugins.onLog, handler);
    }

    onError(handler: (error: any, meta: ILogMeta) => void) {
        this.registryWritePlugin(LoggerPlugins.onError, handler);
    }
}
