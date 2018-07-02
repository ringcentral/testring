import {
    hasOwn,
    isGenKeyType,
} from './utils';
import {ElementPath} from './element-path';

type KeyType = string | number | symbol;

type PropertyDescriptor = {
    enumerable?: boolean,
    writable?: boolean,
    configurable?: boolean,
    value?: any,
    getter?: () => any,
    setter?: () => any,
} | undefined;

const PROXY_FIELDS = ['__path', '__parentPath', '__flows', '__searchOptions', '__proxy'];

export function proxyfy(instance: ElementPath, strictMode: boolean = true): any {
    const revocable = Proxy.revocable(instance, {
        get: (target, key) => getTrap(target, key),
        set: (target, key, value) => setTrap(target, key, value),
        deleteProperty: (target, key) => deleteTrap(target, key),
        has: (target, key) => hasTrap(target, key),

        ownKeys: (target) => ownKeysTrap(target),
        getOwnPropertyDescriptor: (target, key) => getOwnPropertyDescriptorTrap(target, key),
        defineProperty: (target, key, descriptor) => defineOwnPropertyTrap(target, key, descriptor),

        getPrototypeOf: (target) => getPrototypeOfTrap(target),
        setPrototypeOf: (target, proto) => setPrototypeOfTrap(target, proto),

        isExtensible: (target) => isExtensibleTrap(target),
        preventExtensions: (target) => preventExtensionsTrap(target),
    });
    const proxy = revocable.proxy;

    function isPrivateProperty(key: KeyType): boolean {
        return typeof key === 'string' && key.indexOf('__') === 0 && key !== '__path' && key !== '__flows';
    }

    function getReflectedProperty(key, ctx = instance) {
        let item = Reflect.get(instance, key);

        if (typeof item === 'function') {
            return new Proxy(item, {
                apply: (target, thisArg, argumentsList) => {
                    if (thisArg === proxy) {
                        return Reflect.get(ctx, key).apply(instance, argumentsList);
                    //} else if (thisArg instanceof instance.constructor) {
                    //    return Reflect.get(ctx, key).apply(thisArg.__getInstance(), argumentsList);
                    } else {
                        return Reflect.get(ctx, key).apply(thisArg, argumentsList);
                    }
                },
            });
        } else {
            return Reflect.get(instance, key);
        }
    }

    function getTrap(target: ElementPath, key: KeyType): any {
        if (key === '') {
            throw new TypeError('Key can not me empty');
        }

        if (hasOwn(instance, key) && typeof key !== 'symbol' && instance.hasFlow(key)) {
            throw new TypeError(`flow and own property ${key} are conflicts`);
        }

        if (hasOwn(instance, key)) {
            return getReflectedProperty(key);
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
            return () => instance;
        }

        if (key === '__reverse') {
            return instance.getReversedChain;
        }

        if (strictMode && (key === 'xpathByElement' || key === 'xpath')) {
            throw Error('Can not use xpath query in strict mode');
        }

        if (key === 'xpathByElement') {
            return (element: {xpath: string}) => proxyfy(instance.generateChildByXpath(element.xpath), strictMode);
        }

        if (key === 'xpath') {
            return (xpath: string) => proxyfy(instance.generateChildByXpath(xpath), strictMode);
        }

        if (typeof key !== 'symbol' && instance.hasFlow(key)) {
            return instance.getFlow(key);
        }

        if (key in instance) {
            return getReflectedProperty(key);
        }

        if (isGenKeyType(key) && typeof key !== 'symbol') {
            return proxyfy(instance.generateChildElementsPath(key), strictMode);
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

    function ownKeysTrap(target: ElementPath): KeyType[] {
        let keys = ['__flows', '__path'];

        return keys.concat(Object.keys(instance.getFlows() || {}));
    }

    function defineOwnPropertyTrap(target: ElementPath, key: KeyType, descriptor: PropertyDescriptor): boolean {
        return false;
    }

    function getOwnPropertyDescriptorTrap(target: ElementPath, key: KeyType): PropertyDescriptor {
        let defaultDescriptor = {
            enumerable: false,
            writable: false,
            configurable: true,
        };

        if (hasOwn(instance, key)) {
            const descriptor = Reflect.getOwnPropertyDescriptor(instance, key);

            return Object.assign({}, descriptor, {
                enumerable: !isPrivateProperty(key),
                writable: false,
            });
        }

        if (typeof key === 'string' && PROXY_FIELDS.includes(key)) {
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

    function getPrototypeOfTrap(target: ElementPath): object {
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
