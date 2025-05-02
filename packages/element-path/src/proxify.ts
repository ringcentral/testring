/* eslint-disable prefer-spread,prefer-rest-params */
import {hasOwn, isGenKeyType} from './utils';
import {ElementPath, SearchObject} from './element-path';

type KeyType = string | number | symbol;

type PropertyDescriptor =
    | {
          enumerable?: boolean;
          writable?: boolean;
          configurable?: boolean;
          value?: any;
          getter?: () => any;
          setter?: () => any;
      }
    | undefined;

export type XpathLocatorProxified = {
    id: string;
    locator: string;
    parent?: string;
    jira?: string;
};

const PROXY_OWN_PROPS = ['__flows', '__path'];
const PROXY_PROPS = [
    '__path',
    '__parentPath',
    '__flows',
    '__searchOptions',
    '__proxy',
];

export function proxify(instance: ElementPath, strictMode = true) {
    const revocable = Proxy.revocable<ElementPath>(instance, {
        /* eslint-disable no-use-before-define */
        get: getTrap,
        set: setTrap,
        deleteProperty: deleteTrap,
        has: hasTrap,

        ownKeys: ownKeysTrap,
        getOwnPropertyDescriptor: getOwnPropertyDescriptorTrap,
        defineProperty: defineOwnPropertyTrap,

        getPrototypeOf: getPrototypeOfTrap,
        setPrototypeOf: setPrototypeOfTrap,

        isExtensible: isExtensibleTrap,
        preventExtensions: preventExtensionsTrap,
        /* eslint-enable no-use-before-define */
    });

    const proxy = revocable.proxy;

    function isPrivateProperty(key: KeyType): boolean {
        return (
            typeof key === 'string' &&
            key.indexOf('__') === 0 &&
            !PROXY_OWN_PROPS.includes(key)
        );
    }

    function getReflectedProperty(key: KeyType, ctx = instance) {
        const item = Reflect.get(instance, key);

        if (typeof item === 'function') {
            return new Proxy(item, {
                apply: (_target, thisArg, argumentsList) => {
                    if (thisArg === proxy) {
                        return Reflect.get(ctx, key).apply(
                            instance,
                            argumentsList,
                        );
                    } else if (
                        thisArg instanceof instance.constructor &&
                        typeof (thisArg as any).__getInstance === 'function'
                    ) {
                        return Reflect.get(ctx, key).apply(
                            (thisArg as any).__getInstance(),
                            argumentsList,
                        );
                    }

                    return Reflect.get(ctx, key).apply(thisArg, argumentsList);
                },
            });
        }
        return Reflect.get(instance, key);
    }

    // eslint-disable-next-line sonarjs/cognitive-complexity
    function getTrap(target: ElementPath, key: string | symbol, receiver: any): any {
        if (key === '') {
            throw new TypeError('Key can not me empty');
        }

        if (
            typeof key === 'string' &&
            PROXY_PROPS.includes(key) &&
            target.hasFlow(key)
        ) {
            throw new TypeError(
                `flow function and property ${key} are conflicts`,
            );
        }

        if (hasOwn(target, key) && typeof key !== 'symbol') {
            return proxify(target.generateChildElementsPath(key), strictMode);
        }

        if (key === '__flows') {
            return target.getFlows();
        }

        if (key === '__path') {
            return target.getElementPathChain();
        }

        if (key === '__parentPath') {
            return target.getParentElementPathChain();
        }

        if (key === '__searchOptions') {
            return target.getSearchOptions();
        }

        if (key === '__proxy') {
            return receiver;
        }

        if (key === '__getInstance') {
            return function __getInstance(this: ElementPath) {
                if (this === receiver) {
                    return target;
                }
                return this;
            };
        }

        if (key === '__getChildType') {
            return function __getChildType(this: ElementPath) {
                if (this === receiver) {
                    return target.getElementType();
                }
                return target.getElementType();
            };
        }

        if (key === '__getReversedChain') {
            return function __getReversedChain(this: ElementPath, withRoot?: boolean) {
                if (this === receiver) {
                    return target.getReversedChain(withRoot);
                }
                return target.getReversedChain(withRoot);
            };
        }

        if (key === '__findChildren') {
            return function __findChildren(this: ElementPath, searchOptions: SearchObject, withoutParent?: boolean) {
                if (this === receiver) {
                    return proxify(
                        target.generateChildElementPathByOptions(searchOptions, withoutParent),
                        strictMode,
                    );
                }
                return proxify(
                    target.generateChildElementPathByOptions(searchOptions, withoutParent),
                    strictMode,
                );
            };
        }

        if (
            strictMode &&
            (key === 'xpathByElement' ||
                key === 'xpath' ||
                key === 'xpathByLocator')
        ) {
            throw Error('Can not use xpath query in strict mode');
        }

        if (key === 'xpathByLocator') {
            return (element: XpathLocatorProxified) => {
                if (typeof element.locator !== 'string') {
                    throw Error(
                        'Invalid options, "locator" string is required',
                    );
                }

                return proxify(
                    target.generateChildByLocator({
                        xpath: element.locator,
                        id: element.id,
                        parent: element.parent,
                    }),
                    strictMode,
                );
            };
        }

        // TODO (flops) @deprecated
        if (key === 'xpathByElement') {
            return (element: XpathLocatorProxified) => {
                return proxify(
                    target.generateChildByLocator({
                        id: element.id,
                        xpath: element.locator,
                        parent: element.parent,
                    }),
                    strictMode,
                );
            };
        }

        if (key === 'xpath') {
            return (id: string, xpath: string) => {
                return proxify(
                    target.generateChildByXpath({id, xpath}),
                    strictMode,
                );
            };
        }

        if (typeof key !== 'symbol' && target.hasFlow(key)) {
            return target.getFlow(key);
        }

        if (key in target) {
            return getReflectedProperty(key);
        }

        if (isGenKeyType(key) && typeof key !== 'symbol') {
            return proxify(target.generateChildElementsPath(key), strictMode);
        }
    }

    function hasTrap(target: ElementPath, key: string | symbol): boolean {
        if (isGenKeyType(key)) {
            return true;
        }

        return Reflect.has(target, key);
    }

    function setTrap(_target: ElementPath, _key: string | symbol, _value: any, _receiver: any): boolean {
        throw new TypeError('Immutable object');
    }

    function deleteTrap(_target: ElementPath, _key: string | symbol): boolean {
        throw new TypeError('Immutable object');
    }

    function ownKeysTrap(target: ElementPath): Array<string | symbol> {
        return PROXY_OWN_PROPS.concat(Object.keys(target.getFlows() || {}));
    }

    function defineOwnPropertyTrap(
        _target: ElementPath,
        _key: string | symbol,
        _descriptor: PropertyDescriptor,
    ): boolean {
        return false;
    }

    function getOwnPropertyDescriptorTrap(
        target: ElementPath,
        key: string | symbol,
    ): PropertyDescriptor | undefined {
        const defaultDescriptor = {
            enumerable: false,
            writable: false,
            configurable: true,
        };

        if (typeof key === 'string' && PROXY_PROPS.includes(key)) {
            return Object.assign(defaultDescriptor, {
                enumerable: !isPrivateProperty(key),
                value: getTrap(target, key, target),
            });
        }

        if (typeof key !== 'symbol' && target.hasFlow(key)) {
            return Object.assign(defaultDescriptor, {
                enumerable: true,
                value: target.getFlow(key),
            });
        }

        if (isGenKeyType(key)) {
            return Object.assign(defaultDescriptor, {
                value: getTrap(target, key, target),
            });
        }

        return undefined;
    }

    function getPrototypeOfTrap(target: ElementPath): object | null {
        return Reflect.getPrototypeOf(target);
    }

    function setPrototypeOfTrap(_target: ElementPath, _proto: object): boolean {
        throw new TypeError('Immutable object');
    }

    function isExtensibleTrap(_target: ElementPath): boolean {
        return false;
    }

    function preventExtensionsTrap(_target: ElementPath): boolean {
        return true;
    }

    return proxy;
}
