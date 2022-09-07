import {EventEmitter} from 'events';
import {testAPIController} from '@testring-dev/api';
import {WorkerController} from './worker/worker-controller';
import {
    ITransport,
    TestWorkerAction,
    IWorkerEmitter,
    ITransportDirectMessage,
} from '@testring-dev/types';

export class TestWorkerLocal extends EventEmitter implements IWorkerEmitter {
    private workerController: WorkerController;

    constructor(private transportInstance: ITransport) {
        super();

        this.workerController = new WorkerController(
            this.transportInstance,
            testAPIController,
        );
    }

    public kill() {
        this.emit('exit');
    }

    public send(
        message: ITransportDirectMessage,
        callback: (error: Error) => void,
    ): boolean {
        const {payload, type} = message;

        if (type === TestWorkerAction.executeTest) {
            this.workerController.executeTest(payload);
        }

        return true;
    }
}
