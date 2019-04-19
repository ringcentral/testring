import {
    Action,
} from 'redux';

export enum recorderWebAppAction {
    REGISTER = 'WEB_APP@REGISTER',
    UNREGISTER = 'WEB_APP@UNREGISTER',
}

interface IRecorderWebAppStore {
    ids: string[];
}

interface IRecorderWebAppAction extends Action {
    payload: any;
}

export interface IRecorderWebAppRegisterData {
    id: string;
}

export function webApplicationsReducer(
    state: IRecorderWebAppStore = {
        ids: [],
    },
    action: IRecorderWebAppAction,
) {
    switch (action.type) {
        case recorderWebAppAction.REGISTER: {
            const payload: IRecorderWebAppRegisterData = action.payload;

            return {
                ...state,
                ids: [...state.ids, payload.id],
            };
        }
        case recorderWebAppAction.UNREGISTER: {
            const payload: IRecorderWebAppRegisterData = action.payload;

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
