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
    __getInstance: () => ElementPath;
    __path?: ElementPath['getElementPathChain'];
    __findChildren: (options: any) => ElementPathProxy;
    __getReversedChain: ElementPath['getReversedChain'];
    __getChildType: ElementPath['getElementType'];
} & {
    [key: string]: ElementPathProxy;
};

export function createElementPath(options: createElementPathOptions = {}) {
    const {strictMode, flows} = options;

    const obj = new ElementPath({flows: flows || {}});

    return proxify(obj, strictMode) as ElementPathProxy;
}
