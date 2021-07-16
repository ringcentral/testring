import {createStore, combineReducers, Store} from 'redux';

import recorderReducers from '../reducers';

export function initStore(reducers = {}): Store {
    return createStore(
        combineReducers({
            ...reducers,
            ...recorderReducers,
        }),
    );
}
