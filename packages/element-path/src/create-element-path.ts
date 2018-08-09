import { proxify } from './proxify';
import {
    ElementPath,
    FlowsObject,
} from './element-path';

export type createElementPathOptions = {
    flows?: FlowsObject;
    strictMode?: boolean;
};

export function createElementPath(options: createElementPathOptions = {}) {
    const {
        strictMode,
        flows
    } = options;

    let obj = new ElementPath({ flows });

    return proxify(obj, strictMode);
}
