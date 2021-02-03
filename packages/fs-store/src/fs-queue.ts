import { PluggableModule } from '@testring/pluggable-module';
import { MultiLock, Queue } from '@testring/utils';

const hooks = {
    ON_ACQUIRE : 'onAcquire',
    ON_RELEASE: 'onRelease',
};

export { hooks }; 

export class FSQueue extends PluggableModule {

    private fsLock: MultiLock;
    private fsRequestQue: Queue<[string, string]> = new Queue<[string, string]>();

    constructor(public writeQueLength: number = 10) {
        super(Object.values(hooks));
        this.fsLock = new MultiLock(writeQueLength);
    }

    public acquire(workerId: string, requestId: string) {
        if (this.fsLock.acquire(workerId)) {
            this.callHook(hooks.ON_ACQUIRE, { workerId, requestId });
        } else {
            this.fsRequestQue.push([workerId, requestId]);
        }
    }

    public release(workerId: string, requestId: string) {
        const removed = this.fsRequestQue.remove(([wId, rId]) => wId === workerId && rId === requestId);
        if (removed > 0) {
            return; 
        }
        this.fsLock.release(workerId);
        this.callHook(hooks.ON_RELEASE, { workerId, requestId });
        const newItem = this.fsRequestQue.shift();
        if (newItem) {
            this.acquire(newItem[0], newItem[1]);            
        }
    }

    public clean(workerId: string | void) {
        if (!workerId) {
            this.fsLock.clean();
            this.fsRequestQue.clean();
        } else {
            this.fsLock.clean(workerId);
            this.fsRequestQue.remove(([itemWorkerId]) => itemWorkerId === workerId);
        }
    }
}
