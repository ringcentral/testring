import {run} from 'testring';
import {getEnv} from './test-2.helper';

run((api) => {
    api.log(getEnv(api));
});
