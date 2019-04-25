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

interface IRecorderWindowAction extends Action {
    payload: any;
}

export function windowReducer(
    state: IDevtoolWindowsStore = {
        windows: [],
    },
    action: IRecorderWindowAction,
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
