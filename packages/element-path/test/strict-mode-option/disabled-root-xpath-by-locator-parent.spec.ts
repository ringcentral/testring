import { expect } from 'chai';
import { createElementPath } from '../../src';

import {
    getDescriptor,
    getPrivateDescriptor,

    checkAccessMethods,
    checkPreventExtensions,
    checkProperty,
} from '../utils';


describe('.xpathByLocator() with parent', () => {
    let root = createElementPath({
        strictMode: false,
    });
    let xpathSelectorCall = root.xpathByLocator({
        locator: '//*[@class=\'selected\']',
        id: 'selected',
        parent: 'foo.bar',
    });

    describe('arguments validation', () => {
        it('call without xpath', () => {
            const error = () => root.xpathByLocator({ parent: 'foo.bar' });
            expect(error).to.throw('Invalid options, "locator" string is required');
        });

        it('call with empty string parent', () => {
            const child = root.xpathByLocator({
                id: 'selected',
                locator: '//*[@class=\'selected\']',
                parent: '',
            });
            expect(child.toString()).to.be.equal('(//*[@data-test-automation-id=\'root\']//*[@class=\'selected\'])[1]');
        });

        it('call without id', () => {
            const child = root.xpathByLocator({ locator: '//*[@class=\'selected\']', parent: 'foo.bar' });
            expect(child.toString()).to.be.equal(xpathSelectorCall.toString());
        });

        it('call with empty string id', () => {
            const child = root.xpathByLocator({ id: '', locator: '//*[@class=\'selected\']', parent: 'foo.bar' });
            expect(child.toString()).to.be.equal(xpathSelectorCall.toString());
        });

        it('call with not string', () => {
            const child = root.xpathByLocator({ id: 0, locator: '//*[@class=\'selected\']', parent: 'foo.bar' });
            expect(child.toString()).to.be.equal(xpathSelectorCall.toString());
        });
    });

    describe('basic Object methods', () => {
        it('.toString()', () => {
            expect(xpathSelectorCall.toString()).to.be.equal(
                '(//*[@data-test-automation-id=\'root\']//*[@data-test-automation-id=\'foo\']' +
                '//*[@data-test-automation-id=\'bar\']//*[@class=\'selected\'])[1]');
        });

        it('to string converting', () => {
            expect(`${xpathSelectorCall}`).to.be.equal(
                '(//*[@data-test-automation-id=\'root\']//*[@data-test-automation-id=\'foo\']' +
                '//*[@data-test-automation-id=\'bar\']//*[@class=\'selected\'])[1]');
        });

        it('.toString(true)', () => {
            expect(xpathSelectorCall.toString(true)).to.be.equal(
                '//*[@data-test-automation-id=\'root\']//*[@data-test-automation-id=\'foo\']' +
                '//*[@data-test-automation-id=\'bar\']//*[@class=\'selected\']',
            );
        });

        checkAccessMethods(xpathSelectorCall);
    });

    describe('preventExtensions traps', () => {
        checkPreventExtensions(xpathSelectorCall);
    });

    // Public properties
    describe('.__path property traps', () => {
        checkProperty({
            object: xpathSelectorCall,
            key: '__path',
            valueDescriptor: getDescriptor([
                {
                    'isRoot': true,
                    'name': 'root',
                    'xpath': '//*[@data-test-automation-id=\'root\']',
                },
                {
                    'isRoot': false,
                    'query': {
                        'exactKey': 'foo',
                    },
                    'xpath': '//*[@data-test-automation-id=\'foo\']',
                },
                {
                    'isRoot': false,
                    'query': {
                        'exactKey': 'bar',
                    },
                    'xpath': '//*[@data-test-automation-id=\'bar\']',
                },
                {
                    'isRoot': false,
                    'query': {
                        'id': 'selected',
                        'xpath': '//*[@class=\'selected\']',
                    },
                    'xpath': '//*[@class=\'selected\']',
                },
            ]),
        });
    });
    describe('.__flows property traps', () => {
        checkProperty({
            object: xpathSelectorCall,
            key: '__flows',
            valueDescriptor: getDescriptor({}),
        });
    });

    // Private properties
    describe('.__searchOptions property traps', () => {
        checkProperty({
            object: xpathSelectorCall,
            key: '__searchOptions',
            valueDescriptor: getPrivateDescriptor({
                'id': 'selected',
                'xpath': '//*[@class=\'selected\']',
            }),
        });
    });
    describe('.__parentPath property traps', () => {
        checkProperty({
            object: xpathSelectorCall,
            key: '__parentPath',
            valueDescriptor: getPrivateDescriptor([
                {
                    'isRoot': true,
                    'name': 'root',
                    'xpath': '//*[@data-test-automation-id=\'root\']',
                },
                {
                    'isRoot': false,
                    'query': {
                        'exactKey': 'foo',
                    },
                    'xpath': '//*[@data-test-automation-id=\'foo\']',
                },
                {
                    'isRoot': false,
                    'query': {
                        'exactKey': 'bar',
                    },
                    'xpath': '//*[@data-test-automation-id=\'bar\']',
                },
            ]),
        });
    });

    describe('.__getReversedChain call', () => {
        it('with root', () => {
            expect(xpathSelectorCall.__getReversedChain()).to.be.equal(
                'root.foo.bar.xpath("selected", "//*[@class=\'selected\']")',
            );
        });
        it('without root', () => {
            expect(xpathSelectorCall.__getReversedChain(false)).to.be.equal(
                '.foo.bar.xpath("selected", "//*[@class=\'selected\']")',
            );
        });
    });
});
