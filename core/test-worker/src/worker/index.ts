import {transport} from '@testring-dev/transport';
import {testAPIController} from '@testring-dev/api';
import {WorkerController} from './worker-controller';

const controller = new WorkerController(transport, testAPIController);

controller.init();
