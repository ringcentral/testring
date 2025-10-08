import {createElementPath} from '../../src/create-element-path';
import {
    ShadowElementPathProxy,
    createShadowElementPathProxy,
    CSS_SELECTOR_PATTERNS,
} from '../../src/shadow-element-path';
import {expect} from 'chai';

const getNewShadowElement = () => {
    const root = createElementPath();
    const shadowRootElement = root['shadowHost'];
    return shadowRootElement?.shadow$ as ShadowElementPathProxy;
};

describe('CSS Basic Selectors', () => {
    describe('Basic functionality', () => {
        it('should generate exact key selector', () => {
            const shadowElement = getNewShadowElement()['shadowButton'];
            expect(shadowElement.isShadowElement).to.equal(true);
            expect(shadowElement.toString()).to.equal(
                `(//*[@data-test-automation-id='root']//*[@data-test-automation-id='shadowHost'])[1]`,
            );
            expect(shadowElement.toShadowCSSSelector()).to.equal(
                '[data-test-automation-id="shadowButton"]',
            );
        });

        it('should return correct toString and isShadowElement', () => {
            const proxy = createShadowElementPathProxy(['/test/path'], 'data-test');
            expect(proxy.toString()).to.equal('/test/path');
            expect(proxy.isShadowElement).to.equal(true);
        });

        it('should handle simple property chaining', () => {
            const proxy = createShadowElementPathProxy(['/test'], 'data-test-automation-id');
            const result = proxy['app']['test'];
            expect(result.toShadowCSSSelector()).to.equal('[data-test-automation-id="app"] [data-test-automation-id="test"]');
        });

        it('should handle shadow$ deep traversal', () => {
            const proxy = createShadowElementPathProxy(['/root'], 'data-test-automation-id');
            const result = proxy['outer'].shadow$['inner'].shadow$['deep'];
            expect(result.toShadowCSSSelector()).to.equal('[data-test-automation-id="deep"]');
            expect(result.getParentSelectors()).to.deep.equal(['/root', '[data-test-automation-id="outer"]', '[data-test-automation-id="inner"]']);
        });

        it('should return parent selectors', () => {
            const proxy = createShadowElementPathProxy(['/root', '/parent'], 'data-test');
            expect(proxy.getParentSelectors()).to.deep.equal(['/root', '/parent']);
        });
    });

    describe('CSS Selector Patterns', () => {
        let proxy: ShadowElementPathProxy;

        beforeEach(() => {
            proxy = createShadowElementPathProxy(['/test'], 'data-test');
        });

        it('should handle wildcard pattern (*)', () => {
            const result = proxy['*'];
            expect(result.toShadowCSSSelector()).to.equal('[data-test]');
        });

        it('should handle suffix pattern (*foo)', () => {
            const result = proxy['*button'];
            expect(result.toShadowCSSSelector()).to.equal('[data-test$="button"]');
        });

        it('should handle prefix pattern (foo*)', () => {
            const result = proxy['button*'];
            expect(result.toShadowCSSSelector()).to.equal('[data-test^="button"]');
        });

        it('should handle contains pattern (*foo*)', () => {
            const result = proxy['*button*'];
            expect(result.toShadowCSSSelector()).to.equal('[data-test*="button"]');
        });

        it('should handle exact match', () => {
            const result = proxy['button'];
            expect(result.toShadowCSSSelector()).to.equal('[data-test="button"]');
        });

        it('should handle escaped asterisks', () => {
            const result = proxy['foo\\*bar'];
            expect(result.toShadowCSSSelector()).to.equal('[data-test="foo*bar"]');
        });

        it('should handle multiple escaped asterisks', () => {
            const result = proxy['foo\\*bar\\*baz'];
            expect(result.toShadowCSSSelector()).to.equal('[data-test="foo*bar*baz"]');
        });
    });

    describe('.and() method', () => {
        let proxy: ShadowElementPathProxy;

        beforeEach(() => {
            proxy = createShadowElementPathProxy(['/test'], 'data-test');
        });

        it('should append pseudo-selector', () => {
            const result = proxy['button'].and(':hover');
            expect(result.toShadowCSSSelector()).to.equal('[data-test="button"]:hover');
        });

        it('should append attribute selector', () => {
            const result = proxy['button'].and('[disabled]');
            expect(result.toShadowCSSSelector()).to.equal('[data-test="button"][disabled]');
        });

        it('should append class selector', () => {
            const result = proxy['button'].and('.active');
            expect(result.toShadowCSSSelector()).to.equal('[data-test="button"].active');
        });

        it('should append ID selector', () => {
            const result = proxy['button'].and('#main');
            expect(result.toShadowCSSSelector()).to.equal('[data-test="button"]#main');
        });

        it('should append complex pseudo-selector', () => {
            const result = proxy['button'].and(':nth-child(2 of .item)');
            expect(result.toShadowCSSSelector()).to.equal('[data-test="button"]:nth-child(2 of .item)');
        });

        it('should handle multiple .and() calls', () => {
            const result = proxy['button'].and(':hover').and('.active');
            expect(result.toShadowCSSSelector()).to.equal('[data-test="button"]:hover.active');
        });

        it('should handle .and() on empty selector', () => {
            const result = proxy.and(':hover');
            expect(result.toShadowCSSSelector()).to.equal('');
        });
    });

    describe('.then() method', () => {
        let proxy: ShadowElementPathProxy;

        beforeEach(() => {
            proxy = createShadowElementPathProxy(['/test'], 'data-test');
        });

        it('should add descendant selector', () => {
            const result = proxy['container'].then('button');
            expect(result.toShadowCSSSelector()).to.equal('[data-test="container"] button');
        });

        it('should add child selector', () => {
            const result = proxy['container'].then('> button');
            expect(result.toShadowCSSSelector()).to.equal('[data-test="container"] > button');
        });

        it('should add adjacent sibling selector', () => {
            const result = proxy['container'].then('+ .badge');
            expect(result.toShadowCSSSelector()).to.equal('[data-test="container"] + .badge');
        });

        it('should add general sibling selector', () => {
            const result = proxy['container'].then('~ .sibling');
            expect(result.toShadowCSSSelector()).to.equal('[data-test="container"] ~ .sibling');
        });

        it('should handle multiple .then() calls', () => {
            const result = proxy['container'].then('ul').then('> li');
            expect(result.toShadowCSSSelector()).to.equal('[data-test="container"] ul > li');
        });

        it('should handle .then() on empty selector', () => {
            const result = proxy.then('button');
            expect(result.toShadowCSSSelector()).to.equal('button');
        });
    });

    describe('Method chaining', () => {
        let proxy: ShadowElementPathProxy;

        beforeEach(() => {
            proxy = createShadowElementPathProxy(['/test'], 'data-test');
        });

        it('should chain .then() and .and()', () => {
            const result = proxy['container'].then('button').and(':hover');
            expect(result.toShadowCSSSelector()).to.equal('[data-test="container"] button:hover');
        });

        it('should chain multiple .then() and .and()', () => {
            const result = proxy['container'].then('ul').then('> li').and(':nth-child(2)');
            expect(result.toShadowCSSSelector()).to.equal('[data-test="container"] ul > li:nth-child(2)');
        });

        it('should chain pattern matching with methods', () => {
            const result = proxy['*card*'].then('> .title').and('.active');
            expect(result.toShadowCSSSelector()).to.equal('[data-test*="card"] > .title.active');
        });
    });

    describe('Error handling', () => {
        let proxy: ShadowElementPathProxy;

        beforeEach(() => {
            proxy = createShadowElementPathProxy(['/test'], 'data-test');
        });

        it('should throw error for integer property access', () => {
            expect(() => proxy[0]).to.throw('Index access is not supported. Received integer property: 0');
        });

        it('should throw error for negative integer property access', () => {
            expect(() => proxy[-1]).to.throw('Index access is not supported. Received integer property: -1');
        });

        it('should throw error for string integer property access', () => {
            expect(() => proxy['5']).to.throw('Index access is not supported. Received integer property: 5');
        });

        it('should not throw error for non-integer numeric strings', () => {
            expect(() => proxy['5.5']).to.not.throw();
        });

        it('should not throw error for NaN strings', () => {
            expect(() => proxy['abc']).to.not.throw();
        });
    });

    describe('Edge cases', () => {
        let proxy: ShadowElementPathProxy;

        beforeEach(() => {
            proxy = createShadowElementPathProxy(['/test'], 'data-test');
        });

        it('should throw error for empty string property', () => {
            expect(() => proxy['']).to.throw('Empty string property is not supported');
        });

        it('should handle single character patterns', () => {
            const result = proxy['a'];
            expect(result.toShadowCSSSelector()).to.equal('[data-test="a"]');
        });

        it('should handle patterns with only asterisks', () => {
            const result = proxy['**'];
            expect(result.toShadowCSSSelector()).to.equal('[data-test="**"]');
        });

        it('should handle patterns with multiple asterisks', () => {
            const result = proxy['*a*b*'];
            expect(result.toShadowCSSSelector()).to.equal('[data-test="*a*b*"]');
        });

        it('should handle .and() on empty cssParts array', () => {
            const result = proxy.and(':hover');
            expect(result.toShadowCSSSelector()).to.equal('');
        });

        it('should handle symbol properties', () => {
            const symbol = Symbol('test');
            const result = proxy[symbol];
            expect(result).to.equal(proxy);
        });
    });

    describe('CSS_SELECTOR_PATTERNS', () => {
        it('should match wildcard pattern', () => {
            expect(CSS_SELECTOR_PATTERNS.WILDCARD.test('*')).to.equal(true);
            expect(CSS_SELECTOR_PATTERNS.WILDCARD.test('**')).to.equal(false);
            expect(CSS_SELECTOR_PATTERNS.WILDCARD.test('a*')).to.equal(false);
        });

        it('should match suffix pattern', () => {
            expect(CSS_SELECTOR_PATTERNS.SUFFIX.test('*foo')).to.equal(true);
            expect(CSS_SELECTOR_PATTERNS.SUFFIX.test('*foo*')).to.equal(false);
            expect(CSS_SELECTOR_PATTERNS.SUFFIX.test('foo*')).to.equal(false);
        });

        it('should match prefix pattern', () => {
            expect(CSS_SELECTOR_PATTERNS.PREFIX.test('foo*')).to.equal(true);
            expect(CSS_SELECTOR_PATTERNS.PREFIX.test('*foo*')).to.equal(false);
            expect(CSS_SELECTOR_PATTERNS.PREFIX.test('*foo')).to.equal(false);
        });

        it('should match contains pattern', () => {
            expect(CSS_SELECTOR_PATTERNS.CONTAINS.test('*foo*')).to.equal(true);
            expect(CSS_SELECTOR_PATTERNS.CONTAINS.test('*foo')).to.equal(false);
            expect(CSS_SELECTOR_PATTERNS.CONTAINS.test('foo*')).to.equal(false);
            expect(CSS_SELECTOR_PATTERNS.CONTAINS.test('**')).to.equal(false);
        });
    });
});
