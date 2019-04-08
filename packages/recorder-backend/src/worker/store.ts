import { createStore, Store, combineReducers } from 'redux';

// enum recorderWindowsActions {
//     OPEN_WINDOW = 'OPEN_WINDOW',
// }
//
// interface IRecorderExtentionWindow {
//     id: string;
//     position: 'bottom' | 'overlay';
//     url: string;
// }
//
// interface IRecorderWindowsStore {
//     windows: IRecorderExtentionWindow[];
// }
//
// function windowReducer(state: IRecorderWindowsStore, action) {
//     switch (action.type) {
//         case recorderWindowsActions.OPEN_WINDOW:
//             return {
//                 ...state,
//                 windows: [...state.windows, action.payload],
//             };
//         default:
//             return state;
//     }
// }

export function initStore(reducers, initialState = {}): Store {
    return createStore(combineReducers({
        ...reducers,
        //windows: windowReducer,
    }), {
        ...initialState,
        windows: {},
    });
}
