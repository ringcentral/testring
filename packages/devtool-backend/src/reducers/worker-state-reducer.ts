import {Action} from 'redux';

import {ITestControllerExecutionState} from '@testring-dev/types';

export enum devtoolWorkerStateActions {
    UPDATE = 'WORKER_STATE@UPDATE',
}

interface IDevtoolWorkerStateAction extends Action {
    type: devtoolWorkerStateActions;
    payload: any;
}

export function workerStateReducer(
    state: ITestControllerExecutionState = {
        paused: false,
        pausedTilNext: false,
        pending: false,
    },
    action: IDevtoolWorkerStateAction,
) {
    switch (action.type) {
        case devtoolWorkerStateActions.UPDATE:
            const payload: ITestControllerExecutionState = action.payload;

            return {
                ...state,
                ...payload,
            };
        default:
            return state;
    }
}
