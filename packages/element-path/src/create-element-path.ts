import {proxify, XpathLocatorProxified} from './proxify';
import {ElementPath, FlowsObject} from './element-path';

export type createElementPathOptions = {
    flows?: FlowsObject;
    strictMode?: boolean;
};

export type ElementPathProxy = ElementPath & {
    xpathByLocator: (element: XpathLocatorProxified) => ElementPathProxy;
    xpathByElement: (element: XpathLocatorProxified) => ElementPathProxy;
    xpath: (id: string, xpath: string) => ElementPathProxy;
} & {
    [key: string] : ElementPathProxy
};

export function createElementPath(options: createElementPathOptions = {}) {
    const {strictMode, flows} = options;

    const obj = new ElementPath({flows});

    return proxify(obj, strictMode) as ElementPathProxy;
}
