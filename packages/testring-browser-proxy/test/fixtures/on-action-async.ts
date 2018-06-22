import {BrowserProxyActions} from '../../src/structs';

export default (command) => new Promise((resolve, reject) => {
    setTimeout(() => {
        const { action } = command;

        switch (action) {
            case BrowserProxyActions.click:
                return resolve();
            default:
                return reject(new Error(`Cannot execute action "${action}"`));
        }
    }, 300);
});
