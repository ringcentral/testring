/* eslint-disable @typescript-eslint/ban-ts-comment */
import {expect} from 'chai';
import {createElementPath} from '../../src';

import {
    getDescriptor,
    getPrivateDescriptor,
    checkAccessMethods,
    checkPreventExtensions,
    checkProperty,
} from '../utils';

describe('.xpath()', () => {
    const root = createElementPath({
        strictMode: false,
    });
    const fooElement = root['foo'];
    if (!fooElement) {throw new Error('Element not found');}
    const xpathSelectorCall = fooElement.xpath(
        'selected',
        "//*[@class='selected']",
    );

    describe('arguments validation', () => {
        it('call without xpath and id', () => {
            // @ts-ignore
            const error = () => root['foo']?.xpath();
            expect(error).to.throw(
                'Invalid options, "xpath" string is required',
            );
        });

        it('call without xpath', () => {
            // @ts-ignore
            const error = () => root['foo']?.xpath('test');
            expect(error).to.throw(
                'Invalid options, "xpath" string is required',
            );
        });

        it('call without id', () => {
            const child = root['foo']?.xpath(
                // @ts-ignore
                undefined,
                "//*[@class='selected']",
            );
            if (!child) {throw new Error('Element not found');}
            expect(child.toString()).to.be.equal(xpathSelectorCall.toString());
        });

        it('call with empty string id', () => {
            const child = root['foo']?.xpath('', "//*[@class='selected']");
            if (!child) {throw new Error('Element not found');}
            expect(child.toString()).to.be.equal(xpathSelectorCall.toString());
        });

        it('call with not string', () => {
            const child = root['foo']?.xpath(
                // @ts-ignore
                0,
                "//*[@class='selected']",
            );
            if (!child) {throw new Error('Element not found');}
            expect(child.toString()).to.be.equal(xpathSelectorCall.toString());
        });
    });

    describe('basic Object methods', () => {
        it('.toString()', () => {
            expect(xpathSelectorCall.toString()).to.be.equal(
                "(//*[@data-test-automation-id='root']" +
                    "//*[@data-test-automation-id='foo']//*[@class='selected'])[1]",
            );
        });

        it('to string converting', () => {
            expect(`${xpathSelectorCall}`).to.be.equal(
                "(//*[@data-test-automation-id='root']" +
                    "//*[@data-test-automation-id='foo']//*[@class='selected'])[1]",
            );
        });

        it('.toString(true)', () => {
            expect(xpathSelectorCall.toString(true)).to.be.equal(
                "//*[@data-test-automation-id='root']//*[@data-test-automation-id='foo']//*[@class='selected']",
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
                    isRoot: true,
                    name: 'root',
                    xpath: "//*[@data-test-automation-id='root']",
                },
                {
                    isRoot: false,
                    query: {
                        exactKey: 'foo',
                    },
                    xpath: "//*[@data-test-automation-id='foo']",
                },
                {
                    isRoot: false,
                    query: {
                        id: 'selected',
                        xpath: "//*[@class='selected']",
                    },
                    xpath: "//*[@class='selected']",
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
                id: 'selected',
                xpath: "//*[@class='selected']",
            }),
        });
    });
    describe('.__parentPath property traps', () => {
        checkProperty({
            object: xpathSelectorCall,
            key: '__parentPath',
            valueDescriptor: getPrivateDescriptor([
                {
                    isRoot: true,
                    name: 'root',
                    xpath: "//*[@data-test-automation-id='root']",
                },
                {
                    isRoot: false,
                    query: {
                        exactKey: 'foo',
                    },
                    xpath: "//*[@data-test-automation-id='foo']",
                },
            ]),
        });
    });

    describe('.__getReversedChain call', () => {
        it('with root', () => {
            expect(xpathSelectorCall.__getReversedChain()).to.be.equal(
                'root.foo.xpath("selected", "//*[@class=\'selected\']")',
            );
        });
        it('without root', () => {
            expect(xpathSelectorCall.__getReversedChain(false)).to.be.equal(
                '.foo.xpath("selected", "//*[@class=\'selected\']")',
            );
        });
    });
});
