import {
    Action,
} from 'redux';

export enum devtoolWindowsActions {
    OPEN_WINDOW = 'WINDOWS@OPEN_WINDOW',
}

interface IDevtoolExtensionWindow {
    id: string;
    position: 'bottom' | 'overlay';
    url: string;
}

interface IDevtoolWindowsStore {
    windows: IDevtoolExtensionWindow[];
}

interface IDevtoolWindowAction extends Action {
    type: devtoolWindowsActions;
    payload: any;
}

export function windowReducer(
    state: IDevtoolWindowsStore = {
        windows: [],
    },
    action: IDevtoolWindowAction,
) {
    switch (action.type) {
        case devtoolWindowsActions.OPEN_WINDOW:
            const payload: IDevtoolExtensionWindow = action.payload;

            return {
                ...state,
                windows: [...state.windows, payload],
            };
        default:
            return state;
    }
}
