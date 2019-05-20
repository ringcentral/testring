import {
    DependencyDict,
    IDevtoolEndScope,
    IDevtoolStartScope,
} from '@testring/types';
import {
    Action,
} from 'redux';

export enum devtoolDependenciesActions {
    UPDATE = 'DEPENDENCIES@UPDATE',
    CHANGE = 'DEPENDENCIES@CHANGE',
    ADD_HIGHLIGHT = 'DEPENDENCIES@ADD_HIGHLIGHT',
    REMOVE_HIGHLIGHT = 'DEPENDENCIES@REMOVE_HIGHLIGHT',
}

interface IDevtoolDependenciesStore {
    highlights: Array<IDevtoolStartScope>;
    entryPath: string;
    dependencies: DependencyDict;
}

interface IDevtoolDependenciesUpdatePayload extends IDevtoolDependenciesStore {}

interface IDevtoolDependenciesChangePayload {
    filename: string;
    source: string;
}

interface IDevtoolDependenciesUpdateAction extends Action {
    type: devtoolDependenciesActions.UPDATE;
    payload: IDevtoolDependenciesUpdatePayload;
}

interface IDevtoolDependenciesChangeAction extends Action {
    type: devtoolDependenciesActions.CHANGE;
    payload: IDevtoolDependenciesChangePayload;
}

interface IDevtoolDependenciesAddHighlightAction extends Action {
    type: devtoolDependenciesActions.ADD_HIGHLIGHT;
    payload: IDevtoolStartScope;
}

interface IDevtoolDependenciesRemoveHighlightAction extends Action {
    type: devtoolDependenciesActions.REMOVE_HIGHLIGHT;
    payload: IDevtoolEndScope;
}

type DevtoolDependencyAction = IDevtoolDependenciesUpdateAction
    | IDevtoolDependenciesChangeAction
    | IDevtoolDependenciesAddHighlightAction
    | IDevtoolDependenciesRemoveHighlightAction;

export function dependenciesReducer(
    state: IDevtoolDependenciesStore = {
        highlights: [],
        entryPath: '',
        dependencies: {},
    },
    action: DevtoolDependencyAction,
) {
    switch (action.type) {
        case devtoolDependenciesActions.UPDATE: {
            const payload = action.payload;

            return {
                ...state,
                ...payload,
            };
        }
        case devtoolDependenciesActions.CHANGE: {
            const { filename, source } = action.payload;
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
        case devtoolDependenciesActions.ADD_HIGHLIGHT: {
            return {
                ...state,
                highlights: [...state.highlights, action.payload],
            };
        }
        case devtoolDependenciesActions.REMOVE_HIGHLIGHT: {
            const payload = action.payload;

            return {
                ...state,
                highlights: state.highlights.filter((item) => {
                    return item.filename !== payload.filename && item.id !== payload.id;
                }),
            };
        }

        default:
            return state;
    }
}
