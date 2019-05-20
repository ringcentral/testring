import { DependencyDict } from '@testring/types';
import {
    Action,
} from 'redux';

export enum devtoolDependenciesActions {
    UPDATE = 'DEPENDENCIES@UPDATE',
    CHANGE = 'DEPENDENCIES@CHANGE',
}

interface IDevtoolDependenciesStore {
    entryPath: string;
    dependencies: DependencyDict;
}

interface IDevtoolDependenciesUpdatePayload extends IDevtoolDependenciesStore {}

interface IDevtoolDependenciesChangePayload {
    filename: string;
    source: string;
}

interface IDevtoolDependenciesAction extends Action {
    type: devtoolDependenciesActions;
    payload: IDevtoolDependenciesUpdatePayload | IDevtoolDependenciesChangePayload;
}

export function dependenciesReducer(
    state: IDevtoolDependenciesStore = {
        entryPath: '',
        dependencies: {},
    },
    action: IDevtoolDependenciesAction,
) {
    switch (action.type) {
        case devtoolDependenciesActions.UPDATE: {
            const payload = action.payload as IDevtoolDependenciesUpdatePayload;

            return {
                ...state,
                ...payload,
            };
        }
        case devtoolDependenciesActions.CHANGE: {
            const { filename, source } = action.payload as IDevtoolDependenciesChangePayload;
            let dependencies;

            dependencies = {
                [filename]: {
                    ...(state.dependencies[filename] || {}),
                    source,
                },
            };

            return {
                ...state,
                dependencies,
            };
        }
        default:
            return state;
    }
}
