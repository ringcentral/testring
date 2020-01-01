import { expect } from 'chai';
import { createElementPath } from '../../src';

const has = (obj: any, key: PropertyKey) => Object.prototype.hasOwnProperty.call(obj, key);

describe('not supported keys', () => {
    let empty = createElementPath();

    it('get [Symbol]', () => {
        let symbol = Symbol('test');
        expect(empty[symbol]).to.be.equal(undefined);
    });

    it('.hasOwnProperty [Symbol]', () => {
        let symbol = Symbol('test');
        expect(has(empty, symbol)).to.be.equal(false);
    });

    it('Object.hasOwnProperty.call [Symbol]', () => {
        let symbol = Symbol('test');
        expect(has(empty, symbol)).to.be.equal(false);
    });

    it('in [Symbol]', () => {
        let symbol = Symbol('test');
        expect(symbol in empty).to.be.equal(false);
    });

    it('descriptor [Symbol]', () => {
        let symbol = Symbol('test');
        expect(Object.getOwnPropertyDescriptor(empty, symbol)).to.be.equal(undefined);
    });
});
