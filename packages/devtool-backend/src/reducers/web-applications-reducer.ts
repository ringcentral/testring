import {Action} from 'redux';

export enum devtoolWebAppAction {
    REGISTER = 'WEB_APP@REGISTER',
    UNREGISTER = 'WEB_APP@UNREGISTER',
}

interface IDevtoolWebAppStore {
    ids: string[];
}

interface IDevtoolWebAppAction extends Action {
    payload: any;
}

export interface IDevtoolWebAppRegisterData {
    id: string;
}

export function webApplicationsReducer(
    state: IDevtoolWebAppStore = {
        ids: [],
    },
    action: IDevtoolWebAppAction,
) {
    switch (action.type) {
        case devtoolWebAppAction.REGISTER: {
            const payload: IDevtoolWebAppRegisterData = action.payload;

            return {
                ...state,
                ids: [...state.ids, payload.id],
            };
        }
        case devtoolWebAppAction.UNREGISTER: {
            const payload: IDevtoolWebAppRegisterData = action.payload;

            const ids = state.ids.filter((id) => id === payload.id);

            return {
                ...state,
                ids,
            };
        }
        default:
            return state;
    }
}
