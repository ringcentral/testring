import {expect} from 'chai';
import {createElementPath, ElementPathProxy} from '../../src';

describe('base methods', () => {
    describe('creation', () => {
        const dummy = createElementPath();

        it('checking proxy object', () => {
            expect(dummy.__proxy).to.be.equal(dummy);
        });

        it('checking instance object', () => {
            expect(dummy.__getInstance()).not.to.be.equal(dummy);
        });
    });

    describe('set', () => {
        it('set property', () => {
            const dummy = createElementPath();

            const setter = () => (dummy.test = 123 as unknown as ElementPathProxy);
            expect(setter).to.throw(TypeError, 'Immutable object');
        });

        it('set own property', () => {
            const dummy = createElementPath();

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const setter = () => (dummy.__path = 123);
            expect(setter).to.throw(TypeError, 'Immutable object');
        });
    });

    describe('delete', () => {
        it('delete property', () => {
            const dummy = createElementPath();

            const setter = () => delete dummy.test;
            expect(setter).to.throw(TypeError, 'Immutable object');
        });

        it('set own property', () => {
            const dummy = createElementPath();

            const setter = () => delete dummy.__path;
            expect(setter).to.throw(TypeError, 'Immutable object');
        });
    });
});
