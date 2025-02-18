/* eslint-disable prefer-spread,prefer-rest-params */
import {hasOwn, isGenKeyType} from './utils';
import {ElementPath} from './element-path';

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

    function getReflectedProperty(key, ctx = instance) {
        const item = Reflect.get(instance, key);

        if (typeof item === 'function') {
            return new Proxy(item, {
                apply: (target, thisArg, argumentsList) => {
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
    function getTrap(target: ElementPath, key: KeyType): any {
        if (key === '') {
            throw new TypeError('Key can not me empty');
        }

        if (
            typeof key === 'string' &&
            PROXY_PROPS.includes(key) &&
            instance.hasFlow(key)
        ) {
            throw new TypeError(
                `flow function and property ${key} are conflicts`,
            );
        }

        if (hasOwn(instance, key) && typeof key !== 'symbol') {
            return proxify(instance.generateChildElementsPath(key), strictMode);
        }

        if (key === '__flows') {
            return instance.getFlows();
        }

        if (key === '__path') {
            return instance.getElementPathChain();
        }

        if (key === '__parentPath') {
            return instance.getParentElementPathChain();
        }

        if (key === '__searchOptions') {
            return instance.getSearchOptions();
        }

        if (key === '__proxy') {
            return proxy;
        }

        if (key === '__getInstance') {
            return function __getInstance() {
                if (this === proxy) {
                    return instance;
                }
                return this;
            };
        }

        if (key === '__getChildType') {
            return function __getChildType() {
                if (this === proxy) {
                    return instance.getElementType.apply(instance, arguments);
                }
                return instance.getElementType.apply(this, arguments);
            };
        }

        if (key === '__getReversedChain') {
            return function __getReversedChain() {
                if (this === proxy) {
                    return instance.getReversedChain.apply(instance, arguments);
                }
                return instance.getReversedChain.apply(this, arguments);
            };
        }

        if (key === '__findChildren') {
            return function __findChildren() {
                if (this === proxy) {
                    return proxify(
                        instance.generateChildElementPathByOptions.apply(
                            instance,
                            arguments,
                        ),
                        strictMode,
                    );
                }
                return proxify(
                    instance.generateChildElementPathByOptions.apply(
                        this,
                        arguments,
                    ),
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
                    instance.generateChildByLocator({
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
                    instance.generateChildByLocator({
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
                    instance.generateChildByXpath({id, xpath}),
                    strictMode,
                );
            };
        }

        if (typeof key !== 'symbol' && instance.hasFlow(key)) {
            return instance.getFlow(key);
        }

        if (key in instance) {
            return getReflectedProperty(key);
        }

        if (isGenKeyType(key) && typeof key !== 'symbol') {
            return proxify(instance.generateChildElementsPath(key), strictMode);
        }
    }

    function hasTrap(target: ElementPath, key: KeyType): boolean {
        if (isGenKeyType(key)) {
            return true;
        }

        return Reflect.has(instance, key);
    }

    function setTrap(target: ElementPath, key: KeyType, value: any): any {
        throw new TypeError('Immutable object');
    }

    function deleteTrap(target: ElementPath, key: KeyType): any {
        throw new TypeError('Immutable object');
    }

    function ownKeysTrap(target: ElementPath): Array<string | symbol> {
        return PROXY_OWN_PROPS.concat(Object.keys(instance.getFlows() || {}));
    }

    function defineOwnPropertyTrap(
        target: ElementPath,
        key: KeyType,
        descriptor: PropertyDescriptor,
    ): boolean {
        return false;
    }

    function getOwnPropertyDescriptorTrap(
        target: ElementPath,
        key: KeyType,
    ): PropertyDescriptor {
        const defaultDescriptor = {
            enumerable: false,
            writable: false,
            configurable: true,
        };

        if (typeof key === 'string' && PROXY_PROPS.includes(key)) {
            return Object.assign(defaultDescriptor, {
                enumerable: !isPrivateProperty(key),
                value: getTrap(target, key),
            });
        }

        if (typeof key !== 'symbol' && instance.hasFlow(key)) {
            return Object.assign(defaultDescriptor, {
                enumerable: true,
                value: instance.getFlow(key),
            });
        }

        if (isGenKeyType(key)) {
            return Object.assign(defaultDescriptor, {
                value: getTrap(target, key),
            });
        }

        return undefined;
    }

    function getPrototypeOfTrap(target: ElementPath): object | null {
        return Reflect.getPrototypeOf(instance);
    }

    function setPrototypeOfTrap(target: ElementPath, proto: object): any {
        throw new TypeError('Immutable object');
    }

    function isExtensibleTrap(target: ElementPath): boolean {
        return false;
    }

    function preventExtensionsTrap(target: ElementPath): boolean {
        return true;
    }

    return proxy;
}
