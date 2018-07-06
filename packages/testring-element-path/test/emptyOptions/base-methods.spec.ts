import {expect} from 'chai';
import {createElementPath} from '../../src';

describe('base methods', () => {
    describe('creation', () => {
        let dummy = createElementPath();

        it('checking proxy object', () => {
            expect(dummy.__proxy).to.be.equal(dummy);
        });

        it('checking instance object', () => {
            expect(dummy.__getInstance()).not.to.be.equal(dummy);
        });
    });

    describe('set', () => {
        it('set property', () => {
            let dummy = createElementPath();

            let setter = () => dummy.test = 123;
            expect(setter).to.throw(TypeError, 'Immutable object');
        });

        it('set own property', () => {
            let dummy = createElementPath();

            let setter = () => dummy.__path = 123;
            expect(setter).to.throw(TypeError, 'Immutable object');
        });
    });

    describe('delete', () => {
        it('delete property', () => {
            let dummy = createElementPath();

            let setter = () => delete dummy.test;
            expect(setter).to.throw(TypeError, 'Immutable object');
        });

        it('set own property', () => {
            let dummy = createElementPath();

            let setter = () => delete dummy.__path;
            expect(setter).to.throw(TypeError, 'Immutable object');
        });
    });
});
