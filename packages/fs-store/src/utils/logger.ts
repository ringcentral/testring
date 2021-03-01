import * as logGen from 'pino';

const logLevel = process.env.LOG_LEVEL || 'info';

const logger = logGen({ level: logLevel });

function commonLog() {
    return logger;
}
function getNewLog(logData: Record<string, any>) {
    return logger.child(logData);
}

export { commonLog, getNewLog };