import {
    Action,
} from 'redux';

enum recorderWindowsActions {
    OPEN_WINDOW = 'OPEN_WINDOW',
}

interface IRecorderExtensionWindow {
    id: string;
    position: 'bottom' | 'overlay';
    url: string;
}

interface IRecorderWindowsStore {
    windows: IRecorderExtensionWindow[];
}

interface IRecorderWindowAction extends Action {
    payload: any;
}

export function windowReducer(
    state: IRecorderWindowsStore = {
        windows: [],
    },
    action: IRecorderWindowAction,
) {
    switch (action.type) {
        case recorderWindowsActions.OPEN_WINDOW:
            const payload: IRecorderExtensionWindow = action.payload;

            return {
                ...state,
                windows: [...state.windows, payload],
            };
        default:
            return state;
    }
}
