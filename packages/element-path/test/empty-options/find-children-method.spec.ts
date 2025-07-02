import {expect} from 'chai';
import {createElementPath} from '../../src';

describe('find children method', () => {
    it('by exactKey', () => {
        const child = createElementPath().__findChildren({
            exactKey: 'foo',
        });

        expect(child.__getReversedChain()).to.be.equal('root.foo');
    });

    it('by anyKey', () => {
        const child = createElementPath().__findChildren({
            anyKey: true,
        });

        expect(child.__getReversedChain()).to.be.equal('root["*"]');
    });

    it('by suffix', () => {
        const child = createElementPath().__findChildren({
            suffix: 'foo',
        });

        expect(child.__getReversedChain()).to.be.equal('root["*foo"]');
    });

    it('by prefix', () => {
        const child = createElementPath().__findChildren({
            prefix: 'foo',
        });

        expect(child.__getReversedChain()).to.be.equal('root["foo*"]');
    });

    it('by containsKey', () => {
        const child = createElementPath().__findChildren({
            containsKey: 'foo',
        });

        expect(child.__getReversedChain()).to.be.equal('root["*foo*"]');
    });

    it('by parts', () => {
        const child = createElementPath().__findChildren({
            parts: ['foo', 'bar'],
        });

        expect(child.__getReversedChain()).to.be.equal('root["foo*bar"]');
    });

    describe('by text', () => {
        it('by containsText', () => {
            const child = createElementPath().__findChildren({
                containsText: 'text',
            });

            expect(child.__getReversedChain()).to.be.equal('root["{text}"]');
        });

        it('by containsText with exactKey', () => {
            const child = createElementPath().__findChildren({
                exactKey: 'foo',
                containsText: 'text',
            });

            expect(child.__getReversedChain()).to.be.equal('root["foo{text}"]');
        });

        it('by equalsText', () => {
            const child = createElementPath().__findChildren({
                equalsText: 'text',
            });

            expect(child.__getReversedChain()).to.be.equal('root["={text}"]');
        });

        it('by equalsText with exactKey', () => {
            const child = createElementPath().__findChildren({
                exactKey: 'foo',
                equalsText: 'text',
            });

            expect(child.__getReversedChain()).to.be.equal(
                'root["foo={text}"]',
            );
        });
    });

    describe('by index', () => {
        const root = createElementPath();

        it('query from root', () => {
            const error = () => root.__findChildren({index: 1});
            expect(error).to.throw('Root Element is not enumerable');
        });

        it('query from already index', () => {
            const error = () => {
                const element = root['foo']?.[0];
                if (!element) {throw new Error('Element not found');}
                return element.__findChildren({index: 1});
            };
            expect(error).to.throw(
                'Can not select index element from already sliced element',
            );
        });

        it('query from already index', () => {
            const element = root['foo'];
            if (!element) {throw new Error('Element not found');}
            expect(
                element.__findChildren({index: 1}).__getReversedChain(),
            ).to.be.equal('root.foo[1]');
        });
    });

    describe('by subQuery', () => {
        it('by exactKey', () => {
            const child = createElementPath().__findChildren({
                subQuery: {
                    exactKey: 'foo',
                },
            });

            expect(child.__getReversedChain()).to.be.equal('root["(foo)"]');
        });

        it('by anyKey', () => {
            const child = createElementPath().__findChildren({
                subQuery: {
                    anyKey: true,
                },
            });

            expect(child.__getReversedChain()).to.be.equal('root["(*)"]');
        });

        it('by suffix', () => {
            const child = createElementPath().__findChildren({
                subQuery: {
                    suffix: 'foo',
                },
            });

            expect(child.__getReversedChain()).to.be.equal('root["(*foo)"]');
        });

        it('by prefix', () => {
            const child = createElementPath().__findChildren({
                subQuery: {
                    prefix: 'foo',
                },
            });

            expect(child.__getReversedChain()).to.be.equal('root["(foo*)"]');
        });

        it('by containsKey', () => {
            const child = createElementPath().__findChildren({
                subQuery: {
                    containsKey: 'foo',
                },
            });

            expect(child.__getReversedChain()).to.be.equal('root["(*foo*)"]');
        });

        it('by parts', () => {
            const child = createElementPath().__findChildren({
                subQuery: {
                    parts: ['foo', 'bar'],
                },
            });

            expect(child.__getReversedChain()).to.be.equal('root["(foo*bar)"]');
        });

        it('by containsText', () => {
            const child = createElementPath().__findChildren({
                subQuery: {
                    containsText: 'text',
                },
            });

            expect(child.__getReversedChain()).to.be.equal('root["({text})"]');
        });

        it('by containsText with exactKey', () => {
            const child = createElementPath().__findChildren({
                subQuery: {
                    exactKey: 'foo',
                    containsText: 'text',
                },
            });

            expect(child.__getReversedChain()).to.be.equal(
                'root["(foo{text})"]',
            );
        });

        it('by equalsText', () => {
            const child = createElementPath().__findChildren({
                subQuery: {
                    equalsText: 'text',
                },
            });

            expect(child.__getReversedChain()).to.be.equal('root["(={text})"]');
        });

        it('by equalsText with exactKey', () => {
            const child = createElementPath().__findChildren({
                subQuery: {
                    exactKey: 'foo',
                    equalsText: 'text',
                },
            });

            expect(child.__getReversedChain()).to.be.equal(
                'root["(foo={text})"]',
            );
        });

        it('with exactKey by equalsText with containsKey', () => {
            const child = createElementPath().__findChildren({
                exactKey: 'foo',
                subQuery: {
                    exactKey: 'foo',
                    equalsText: 'text',
                },
            });

            expect(child.__getReversedChain()).to.be.equal(
                'root["foo(foo={text})"]',
            );
        });
    });
});
