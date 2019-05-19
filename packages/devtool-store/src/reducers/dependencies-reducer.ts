import { DependencyDict } from '@testring/types';
import {
    Action,
} from 'redux';

export enum devtoolDependenciesActions {
    UPDATE = 'DEPENDENCIES@UPDATE_DEPENDENCIES',
}

interface IDevtoolDependenciesStore {
    entryPath: string;
    dependencies: DependencyDict;
}

interface IDevtoolDependenciesAction extends Action {
    type: devtoolDependenciesActions;
    payload: IDevtoolDependenciesStore;
}

export function dependenciesReducer(
    state: IDevtoolDependenciesStore = {
        entryPath: '',
        dependencies: {},
    },
    action: IDevtoolDependenciesAction,
) {
    switch (action.type) {
        case devtoolDependenciesActions.UPDATE:
            const payload: any = action.payload as IDevtoolDependenciesStore;

            return {
                ...state,
                ...payload,
            };
        default:
            return state;
    }
}
