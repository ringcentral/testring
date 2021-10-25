import {PluginAPI} from '@testring/plugin-api';

import {cbGen} from './onFileName';

export default (pluginAPI: PluginAPI, config) => {
    const {staticPaths = {}} = config;

    const storeServer = pluginAPI.getFSStoreServer();

    storeServer.onFileNameAssign(cbGen(staticPaths));
};
