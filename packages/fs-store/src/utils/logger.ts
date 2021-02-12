import * as logGen from 'pino';

const logLevel = process.env.LOG_LEVEL || 'info';

const logger = logGen({ level: logLevel });

export function commonLog() {
    return logger;
}
export function getNewLog(logData: Record<string, any>) {
    return logger.child(logData);
}