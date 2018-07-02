import {expect} from 'chai';
import {createElementPath} from '../../src';
import {
    getDescriptor,
    getPrivateDescriptor,

    checkAccessMethods,
    checkPreventExtensions,
    checkProperty,
} from '../utils';


describe('empty options ElementPath root[\'={Text element}\']', () => {
    let root = createElementPath();
    let childFoo = root['={Text element}'];

    describe('basic Object methods', () => {
        it('.toString()', () => {
            expect(childFoo.toString()).to.be.equal('(//*[@data-test-automation-id=\'root\']' +
                '/descendant::*[@data-test-automation-id and . = "Text element"])[1]');
        });

        it('to string converting', () => {
            expect(`${childFoo}`).to.be.equal('(//*[@data-test-automation-id=\'root\']' +
                '/descendant::*[@data-test-automation-id and . = "Text element"])[1]');
        });

        it('.toString(true)', () => {
            expect(childFoo.toString(true)).to.be.equal('//*[@data-test-automation-id=\'root\']' +
                '/descendant::*[@data-test-automation-id and . = "Text element"]');
        });

        checkAccessMethods(childFoo);
    });

    describe('preventExtensions traps', () => {
        checkPreventExtensions(childFoo);
    });

    // Public properties
    describe('.__path property traps', () => {
        checkProperty({
            object: childFoo,
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
                        'anyKey': true,
                        'equalsText': 'Text element',
                    },
                    'xpath': '/descendant::*[@data-test-automation-id and . = "Text element"]',
                },
            ]),
        });
    });
    describe('.__flows property traps', () => {
        checkProperty({
            object: childFoo,
            key: '__flows',
            valueDescriptor: getDescriptor({}),
        });
    });

    // Private properties
    describe('.__searchOptions property traps', () => {
        checkProperty({
            object: childFoo,
            key: '__searchOptions',
            valueDescriptor: getPrivateDescriptor({
                'anyKey': true,
                'equalsText': 'Text element',
            }),
        });
    });
    describe('.__parentPath property traps', () => {
        checkProperty({
            object: childFoo,
            key: '__parentPath',
            valueDescriptor: getPrivateDescriptor([
                {
                    'isRoot': true,
                    'name': 'root',
                    'xpath': '//*[@data-test-automation-id=\'root\']',
                },
            ]),
        });
    });

    describe('.__reverse() call', () => {
        it('with root', () => {
            expect(childFoo.__reverse()).to.be.equal('root["*={Text element}"]');
        });
        it('without root', () => {
            expect(childFoo.__reverse(false)).to.be.equal('["*={Text element}"]');
        });
    });
});
