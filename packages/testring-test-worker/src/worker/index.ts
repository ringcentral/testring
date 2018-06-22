import { loggerClient } from '@testring/logger';
import { transport } from '@testring/transport';
import { WorkerController } from './worker-controller';

const controller = new WorkerController(transport);

loggerClient.setLevel(3);
controller.init();
