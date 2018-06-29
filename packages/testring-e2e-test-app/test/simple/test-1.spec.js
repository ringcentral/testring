import { run } from 'testring';

run(() => {
    return new Promise((resolve) => {
        setImmediate(() => {
            global.console.log(['test', { for: 'formating' }]);
            resolve();
        });
    });
});


