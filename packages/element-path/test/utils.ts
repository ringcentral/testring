import {expect} from 'chai';
import {ElementPath} from '../src/element-path';

export function getDescriptor(value) {
    return {
        configurable: true,
        enumerable: true,
        value,
        writable: false,
    };
}

export function getPrivateDescriptor(value) {
    return {
        configurable: true,
        enumerable: false,
        value,
        writable: false,
    };
}

export function checkProperty({object, key, valueDescriptor}) {
    const value = valueDescriptor.value;

    it('get', () => {
        expect(object[key]).to.deep.equal(value);
    });

    it('set', () => {
        const fn = () => (object[key] = {});
        expect(fn).to.throw(TypeError);
    });

    it('delete operator', () => {
        const fn = () => delete object[key];
        expect(fn).to.throw(TypeError);
    });

    it('in operator', () => {
        expect(key in object).to.be.equal(true);
    });

    it('.hasOwnProperty()', () => {
        expect(object).to.have.own.property(key);
    });

    it('.getOwnPropertyDescriptor()', () => {
        const descriptor = Object.getOwnPropertyDescriptor(object, key);
        expect(descriptor).to.deep.equal(valueDescriptor);
    });

    it('.defineProperty()', () => {
        const fn = () => Object.defineProperty(object, key, valueDescriptor);
        expect(fn).to.throw(TypeError);
    });
}

export function checkAccessMethods(object, options: any = {}) {
    const {keys} = options;

    it('.ownKey() trap', () => {
        expect(Object.keys(object)).to.deep.equal(
            keys || ['__flows', '__path'],
        );
    });

    it('.getPrototypeOf() trap', () => {
        const proto = Object.getPrototypeOf(object);
        expect(proto).to.be.equal(ElementPath.prototype);
    });

    it('.setPrototypeOf() trap', () => {
        const fn = () => Object.setPrototypeOf(object, Object.prototype);
        expect(fn).to.throw(TypeError);
    });

    it('.isExtensible() trap', () => {
        const fn = () => Object.isExtensible(object);
        expect(fn).to.throw(TypeError);
    });
}

export function checkPreventExtensions(object: ElementPath) {
    it('.preventExtensions()', () => {
        const fn = () => Object.preventExtensions(object);
        expect(fn).to.throw(TypeError);
    });

    it('.freeze()', () => {
        const fn = () => Object.freeze(object);
        expect(fn).to.throw(TypeError);
    });

    it('.seal()', () => {
        const fn = () => Object.seal(object);
        expect(fn).to.throw(TypeError);
    });
}
