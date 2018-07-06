import { run } from 'testring';

run((context) => {
    return new Promise((resolve) => {
        setImmediate(() => {
            context.log(['test', { for: 'formating' }]);
            resolve();
        });
    });
});


