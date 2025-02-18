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

describe('.xpathByLocator() from root', () => {
    const root = createElementPath({
        strictMode: false,
    });
    const xpathSelectorCall = root.xpathByLocator({
        locator: "//*[@class='selected']",
        id: 'selected',
    });

    describe('arguments validation', () => {
        it('call without xpath', () => {
            // @ts-ignore
            const error = () => root.xpathByLocator({});
            expect(error).to.throw(
                'Invalid options, "locator" string is required',
            );
        });

        it('call without id', () => {
            // @ts-ignore
            const child = root.xpathByLocator({
                locator: "//*[@class='selected']",
            });
            expect(child.toString()).to.be.equal(xpathSelectorCall.toString());
        });

        it('call with empty string id', () => {
            const child = root.xpathByLocator({
                id: '',
                locator: "//*[@class='selected']",
            });
            expect(child.toString()).to.be.equal(xpathSelectorCall.toString());
        });

        it('call with not string', () => {
            const child = root.xpathByLocator({
                // @ts-ignore
                id: 0,
                locator: "//*[@class='selected']",
            });
            expect(child.toString()).to.be.equal(xpathSelectorCall.toString());
        });
    });

    describe('basic Object methods', () => {
        it('.toString()', () => {
            expect(xpathSelectorCall.toString()).to.be.equal(
                "(//*[@class='selected'])[1]",
            );
        });

        it('to string converting', () => {
            expect(`${xpathSelectorCall}`).to.be.equal(
                "(//*[@class='selected'])[1]",
            );
        });

        it('.toString(true)', () => {
            expect(xpathSelectorCall.toString(true)).to.be.equal(
                "//*[@class='selected']",
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
            valueDescriptor: getPrivateDescriptor(null),
        });
    });

    describe('.__getReversedChain call', () => {
        it('with root', () => {
            expect(xpathSelectorCall.__getReversedChain()).to.be.equal(
                '.xpath("selected", "//*[@class=\'selected\']")',
            );
        });
        it('without root', () => {
            expect(xpathSelectorCall.__getReversedChain(false)).to.be.equal(
                '.xpath("selected", "//*[@class=\'selected\']")',
            );
        });
    });
});
