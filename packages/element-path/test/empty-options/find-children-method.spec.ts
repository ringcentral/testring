import { expect } from 'chai';
import { createElementPath } from '../../src';

describe('find children method', () => {
    it('by exactKey', () => {
        let child = createElementPath().__findChildren({
            exactKey: 'foo',
        });

        expect(child.__getReversedChain()).to.be.equal('root.foo');
    });

    it('by anyKey', () => {
        let child = createElementPath().__findChildren({
            anyKey: true,
        });

        expect(child.__getReversedChain()).to.be.equal('root["*"]');
    });

    it('by suffix', () => {
        let child = createElementPath().__findChildren({
            suffix: 'foo',
        });

        expect(child.__getReversedChain()).to.be.equal('root["*foo"]');
    });

    it('by prefix', () => {
        let child = createElementPath().__findChildren({
            prefix: 'foo',
        });

        expect(child.__getReversedChain()).to.be.equal('root["foo*"]');
    });

    it('by containsKey', () => {
        let child = createElementPath().__findChildren({
            containsKey: 'foo',
        });

        expect(child.__getReversedChain()).to.be.equal('root["*foo*"]');
    });

    it('by parts', () => {
        let child = createElementPath().__findChildren({
            parts: ['foo', 'bar'],
        });

        expect(child.__getReversedChain()).to.be.equal('root["foo*bar"]');
    });

    describe('by text', () => {
        it('by containsText', () => {
            let child = createElementPath().__findChildren({
                containsText: 'text',
            });

            expect(child.__getReversedChain()).to.be.equal('root["{text}"]');
        });

        it('by containsText with exactKey', () => {
            let child = createElementPath().__findChildren({
                exactKey: 'foo',
                containsText: 'text',
            });

            expect(child.__getReversedChain()).to.be.equal('root["foo{text}"]');
        });

        it('by equalsText', () => {
            let child = createElementPath().__findChildren({
                equalsText: 'text',
            });

            expect(child.__getReversedChain()).to.be.equal('root["={text}"]');
        });

        it('by equalsText with exactKey', () => {
            let child = createElementPath().__findChildren({
                exactKey: 'foo',
                equalsText: 'text',
            });

            expect(child.__getReversedChain()).to.be.equal('root["foo={text}"]');
        });
    });

    describe('by index', () => {
        let root = createElementPath();

        it('query from root', () => {
            let error = () => root.__findChildren({ index: 1 });
            expect(error).to.throw('Root Element is not enumerable');
        });

        it('query from already index', () => {
            let error = () => root.foo[0].__findChildren({ index: 1 });
            expect(error).to.throw('Can not select index element from already sliced element');
        });

        it('query from already index', () => {
            expect(root.foo.__findChildren({ index: 1 }).__getReversedChain()).to.be.equal('root.foo[1]');
        });
    });

    describe('by subQuery', () => {
        it('by exactKey', () => {
            let child = createElementPath().__findChildren({
                subQuery: {
                    exactKey: 'foo',
                },
            });

            expect(child.__getReversedChain()).to.be.equal('root["(foo)"]');
        });

        it('by anyKey', () => {
            let child = createElementPath().__findChildren({
                subQuery: {
                    anyKey: true,
                },
            });

            expect(child.__getReversedChain()).to.be.equal('root["(*)"]');
        });

        it('by suffix', () => {
            let child = createElementPath().__findChildren({
                subQuery: {
                    suffix: 'foo',
                },
            });

            expect(child.__getReversedChain()).to.be.equal('root["(*foo)"]');
        });

        it('by prefix', () => {
            let child = createElementPath().__findChildren({
                subQuery: {
                    prefix: 'foo',
                },
            });

            expect(child.__getReversedChain()).to.be.equal('root["(foo*)"]');
        });

        it('by containsKey', () => {
            let child = createElementPath().__findChildren({
                subQuery: {
                    containsKey: 'foo',
                },
            });

            expect(child.__getReversedChain()).to.be.equal('root["(*foo*)"]');
        });

        it('by parts', () => {
            let child = createElementPath().__findChildren({
                subQuery: {
                    parts: ['foo', 'bar'],
                },
            });

            expect(child.__getReversedChain()).to.be.equal('root["(foo*bar)"]');
        });

        it('by containsText', () => {
            let child = createElementPath().__findChildren({
                subQuery: {
                    containsText: 'text',
                },
            });

            expect(child.__getReversedChain()).to.be.equal('root["({text})"]');
        });

        it('by containsText with exactKey', () => {
            let child = createElementPath().__findChildren({
                subQuery: {
                    exactKey: 'foo',
                    containsText: 'text',
                },
            });

            expect(child.__getReversedChain()).to.be.equal('root["(foo{text})"]');
        });

        it('by equalsText', () => {
            let child = createElementPath().__findChildren({
                subQuery: {
                    equalsText: 'text',
                },
            });

            expect(child.__getReversedChain()).to.be.equal('root["(={text})"]');
        });

        it('by equalsText with exactKey', () => {
            let child = createElementPath().__findChildren({
                subQuery: {
                    exactKey: 'foo',
                    equalsText: 'text',
                },
            });

            expect(child.__getReversedChain()).to.be.equal('root["(foo={text})"]');
        });

        it('with exactKey by equalsText with containsKey', () => {
            let child = createElementPath().__findChildren({
                exactKey: 'foo',
                subQuery: {
                    exactKey: 'foo',
                    equalsText: 'text',
                },
            });

            expect(child.__getReversedChain()).to.be.equal('root["foo(foo={text})"]');
        });
    });
});
