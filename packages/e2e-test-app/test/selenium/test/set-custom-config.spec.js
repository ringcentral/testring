import {run} from 'testring';
import {WebApplication} from '@testring/api';

class CustomWebApplication extends WebApplication {
    constructor(
        testUID, transport, config
    ) {
        config.seleniumConfig = {
            'hello': 'world',
        };
        super(testUID, transport, config);
    }
}

run(async (api) => {
    const app = api.initCustomApplication(CustomWebApplication);
    const config = await app.client.getCustomBrowserClientConfig();
    await api.log(config)
});