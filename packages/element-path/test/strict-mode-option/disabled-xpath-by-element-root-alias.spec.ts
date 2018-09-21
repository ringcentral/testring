import { expect } from 'chai';
import { createElementPath } from '../../src';

import {
    getDescriptor,
    getPrivateDescriptor,

    checkAccessMethods,
    checkPreventExtensions,
    checkProperty
} from '../utils';


describe('.xpathByElement()', () => {
    let root = createElementPath({
        strictMode: false
    });
    let xpathSelectorCall = root.xpathByElement({
        id: 'selected',
        locator: '//*[@class=\'selected\']',
        parent: '',
    });

    describe('arguments validation', () => {
        it('call without xpath and id', () => {
            const error = () => root.foo.xpathByElement({});
            expect(error).to.throw('Invalid options, "xpath" string is required');
        });

        it('call without xpath', () => {
            const error = () => root.foo.xpathByElement({id: 'selected'});
            expect(error).to.throw('Invalid options, "xpath" string is required');
        });
    });

    describe('basic Object methods', () => {
        it('.toString()', () => {
            expect(xpathSelectorCall.toString()).to.be.equal('(//*[@class=\'selected\'])[1]');
        });

        it('to string converting', () => {
            expect(`${xpathSelectorCall}`).to.be.equal('(//*[@class=\'selected\'])[1]');
        });

        it('.toString(true)', () => {
            expect(xpathSelectorCall.toString(true)).to.be.equal('//*[@class=\'selected\']');
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
                    'isRoot': false,
                    'query': {
                        'id': 'selected',
                        'xpath': '//*[@class=\'selected\']'
                    },
                    'xpath': '//*[@class=\'selected\']',
                },
            ])
        });
    });
    describe('.__flows property traps', () => {
        checkProperty({
            object: xpathSelectorCall,
            key: '__flows',
            valueDescriptor: getDescriptor({})
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
            valueDescriptor: getPrivateDescriptor(null)
        });
    });

    describe('.__getReversedChain call', () => {
        it('with root', () => {
            expect(xpathSelectorCall.__getReversedChain()).to.be.equal(
                '.xpath("selected", "//*[@class=\'selected\']")'
            );
        });
        it('without root', () => {
            expect(xpathSelectorCall.__getReversedChain(false)).to.be.equal(
                '.xpath("selected", "//*[@class=\'selected\']")'
            );
        });
    });
});
