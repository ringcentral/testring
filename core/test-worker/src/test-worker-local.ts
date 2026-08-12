import {EventEmitter} from 'events';
import {testAPIController} from '@testring/api';
import {WorkerController} from './worker/worker-controller';
import {registerEsmLoaderHooks} from './worker/esm-loader-hooks';
import {
    ITransport,
    TestWorkerAction,
    IWorkerEmitter,
    ITransportDirectMessage,
} from '@testring/types';

export class TestWorkerLocal extends EventEmitter implements IWorkerEmitter {
    private workerController: WorkerController;

    constructor(private transportInstance: ITransport) {
        super();

        // A forked worker gets these hooks via ./worker/index.ts's own
        // bootstrap; local mode runs autotests in this same process without
        // going through that entry point, so it has to register them here
        // instead (FR-009: extensionless relative imports must keep working
        // regardless of local vs child-process worker mode).
        registerEsmLoaderHooks();

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
        _callback?: (error: Error | null) => void
    ): boolean {
        const {payload, type} = message;

        if (type === TestWorkerAction.executeTest) {
            this.workerController.executeTest(payload);
        }

        return true;
    }
}
