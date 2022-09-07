import { run } from 'testring-dev';
import { getEnv } from './test-2.helper';

run((api) => {
    api.log(getEnv(api));
});

