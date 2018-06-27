import { transport } from '@testring/transport';
import { WorkerController } from './worker-controller';

const controller = new WorkerController(transport);

controller.init();
