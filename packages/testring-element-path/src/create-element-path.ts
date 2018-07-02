import {proxyfy} from './proxyfy';
import {ElementPath, FlowsObject} from './element-path';

export type createElementPathOptions = {
    flows?: FlowsObject,
    strictMode?: boolean,
};

export function createElementPath(options: createElementPathOptions = {}): any {
    const {
        strictMode,
        ...elementPathOptions
    } = options;

    let obj = new ElementPath(elementPathOptions);
    return proxyfy(obj, strictMode);
}
