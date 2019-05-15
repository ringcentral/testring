import {
    Action,
} from 'redux';

export enum devtoolDependenciesActions {
    UPDATE = 'DEPENDENCIES@UPDATE_DEPENDENCIES',
}

interface IDevtoolDependenciesStore {
    data: any;
}

interface IDevtoolDependenciesAction extends Action {
    type: devtoolDependenciesActions;
    payload: any;
}

export function dependenciesReducer(
    state: IDevtoolDependenciesStore = {
        data: [],
    },
    action: IDevtoolDependenciesAction,
) {
    switch (action.type) {
        case devtoolDependenciesActions.UPDATE:
            const payload: any = action.payload;

            return {
                ...state,
                data: payload,
            };
        default:
            return state;
    }
}
