import {expect} from 'chai';
import {createElementPath} from '../../src';
import {
    getDescriptor,
    getPrivateDescriptor,

    checkAccessMethods,
    checkPreventExtensions,
    checkProperty,
} from '../utils';


describe('empty options ElementPath root[\'*foo\'][0]', () => {
    let root = createElementPath();
    let childFoo = root['*foo'][0];

    describe('basic Object methods', () => {
        it('.toString()', () => {
            expect(childFoo.toString()).to.be.equal('(//*[@data-test-automation-id=\'root\']' +
                '/descendant::*[substring(@data-test-automation-id, ' +
                'string-length(@data-test-automation-id) - string-length(\'foo\') + 1) = \'foo\'][position() = 1])[1]');
        });

        it('to string converting', () => {
            expect(`${childFoo}`).to.be.equal('(//*[@data-test-automation-id=\'root\']' +
                '/descendant::*[substring(@data-test-automation-id, ' +
                'string-length(@data-test-automation-id) - string-length(\'foo\') + 1) = \'foo\'][position() = 1])[1]');
        });

        it('.toString(true)', () => {
            expect(childFoo.toString(true)).to.be.equal('//*[@data-test-automation-id=\'root\']' +
                '/descendant::*[substring(@data-test-automation-id, ' +
                'string-length(@data-test-automation-id) - string-length(\'foo\') + 1) = \'foo\'][position() = 1]');
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
                        'index': 0,
                        'suffix': 'foo',
                    },
                    'xpath': '/descendant::*[substring(@data-test-automation-id, ' +
                    'string-length(@data-test-automation-id) - string-length(\'foo\') + 1) = \'foo\'][position() = 1]',
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
                'suffix': 'foo',
                'index': 0,
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
            expect(childFoo.__reverse()).to.be.equal('root["*foo"][0]');
        });
        it('without root', () => {
            expect(childFoo.__reverse(false)).to.be.equal('["*foo"][0]');
        });
    });
});
