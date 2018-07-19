import { run } from 'testring';

run((api) => {
    api.log(api.getEnvironment());
});

