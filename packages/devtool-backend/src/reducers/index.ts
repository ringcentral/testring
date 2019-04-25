import { devtoolConfigReducer } from './devtool-config-reducer';
import { webApplicationsReducer } from './web-applications-reducer';
import { windowReducer } from './window-reducer';

export default {
    devtoolConfig: devtoolConfigReducer,
    webApplications: webApplicationsReducer,
    window: windowReducer,
};
