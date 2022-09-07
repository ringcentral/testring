import {Action} from 'redux';
import {IDevtoolServerConfig} from '@testring-dev/types';

export enum devtoolConfigActions {
    UPDATE = 'CONFIG@UPDATE_CONFIG',
}

interface IDevtoolWebAppStore extends Partial<IDevtoolServerConfig> {
    initialized: boolean;
}

interface IDevtoolConfigAction extends Action {
    payload: any;
}

export function devtoolConfigReducer(
    state: IDevtoolWebAppStore = {
        initialized: false,
    },
    action: IDevtoolConfigAction,
) {
    switch (action.type) {
        case devtoolConfigActions.UPDATE: {
            const payload: IDevtoolServerConfig = action.payload;

            return {
                ...payload,
                initialized: true,
            };
        }

        default:
            return state;
    }
}
