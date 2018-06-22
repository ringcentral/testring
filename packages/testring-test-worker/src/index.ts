import { transport } from '@testring/transport';
import { TestWorkerInstance } from './test-worker-instance';
import { TestWorker } from './test-worker';

const testWorker = new TestWorker(transport);

export { testWorker, TestWorker, TestWorkerInstance };
