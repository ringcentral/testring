import { transport } from '@testring/transport';
import { testAPIController } from '@testring/api';
import { WorkerController } from './worker-controller';

const controller = new WorkerController(transport, testAPIController);

controller.init();
