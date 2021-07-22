import {expect} from 'chai';
import {createElementPath} from '../../src';

describe('not supported keys', () => {
    const empty = createElementPath();

    it('get [Symbol]', () => {
        const symbol = Symbol('test');
        expect(empty[symbol]).to.be.equal(undefined);
    });

    it('.hasOwnProperty [Symbol]', () => {
        const symbol = Symbol('test');
        // eslint-disable-next-line no-prototype-builtins
        expect(empty.hasOwnProperty(symbol)).to.be.equal(false);
    });

    it('Object.hasOwnProperty.call [Symbol]', () => {
        const symbol = Symbol('test');
        expect(Object.hasOwnProperty.call(empty, symbol)).to.be.equal(false);
    });

    it('in [Symbol]', () => {
        const symbol = Symbol('test');
        expect(symbol in empty).to.be.equal(false);
    });

    it('descriptor [Symbol]', () => {
        const symbol = Symbol('test');
        expect(Object.getOwnPropertyDescriptor(empty, symbol)).to.be.equal(
            undefined,
        );
    });
});
