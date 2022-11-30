import {transport} from '@testring/transport';
import {testAPIController} from '@testring/api';
import {WorkerController} from './worker-controller';
import {loggerClient, LoggerClient} from '@testring/logger';

const controller = new WorkerController(transport, testAPIController);

try {
    controller.init();
} catch (err) {
    const logger: LoggerClient = loggerClient.withPrefix(
        '[worker-controller-init]',
    );
    logger.error(err, 'ERROR during worker executin');
    throw err;
}
