import { dependenciesReducer } from './dependencies-reducer';
import { devtoolConfigReducer } from './devtool-config-reducer';
import { webApplicationsReducer } from './web-applications-reducer';
import { windowReducer } from './window-reducer';
import { workerStateReducer } from './worker-state-reducer';

export default {
    dependencies: dependenciesReducer,
    devtoolConfig: devtoolConfigReducer,
    webApplications: webApplicationsReducer,
    window: windowReducer,
    workerState: workerStateReducer,
};
