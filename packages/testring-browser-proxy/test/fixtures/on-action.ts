import {BrowserProxyActions} from '../../src/structs';

export default (command) => {
    const { action } = command;

    switch (action) {
        case BrowserProxyActions.click:
            return;
        default:
            throw new Error(`Cannot execute action "${action}"`);
    }
};
