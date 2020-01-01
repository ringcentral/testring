import { devtoolConfigReducer } from './devtool-config-reducer';
import { webApplicationsReducer } from './web-applications-reducer';
import { windowReducer } from './window-reducer';
import { workerStateReducer } from './worker-state-reducer';

// eslint-disable-next-line import/no-default-export
export default {
    devtoolConfig: devtoolConfigReducer,
    webApplications: webApplicationsReducer,
    window: windowReducer,
    workerState: workerStateReducer,
};
