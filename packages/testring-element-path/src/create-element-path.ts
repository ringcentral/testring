import {proxyfy} from './proxyfy';
import {ElementPath, FlowsObject} from './element-path';

export type createElementPathOptions = {
    flows?: FlowsObject,
    strictMode?: boolean,
};

export function createElementPath(options: createElementPathOptions = {}): any {
    const {
        strictMode,
        flows,
    } = options;

    let obj = new ElementPath({flows});
    return proxyfy(obj, strictMode);
}
