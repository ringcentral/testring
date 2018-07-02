import {expect} from 'chai';
import {createElementPath} from '../../src';
import {
    getDescriptor,
    getPrivateDescriptor,

    checkAccessMethods,
    checkPreventExtensions,
    checkProperty,
} from '../utils';


describe('empty options ElementPath root[\'*foo*\']', () => {
    let root = createElementPath();
    let childFoo = root['foo*bar'];

    describe('basic Object methods', () => {
        it('.toString()', () => {
            expect(childFoo.toString()).to.be.equal('(//*[@data-test-automation-id=\'root\']' +
                '/descendant::*[substring(@data-test-automation-id, ' +
                'string-length(@data-test-automation-id) - string-length(\'bar\') + 1) = \'bar\' ' +
                'and starts-with(@data-test-automation-id, \'foo\') ' +
                'and string-length(@data-test-automation-id) > 6])[1]');
        });

        it('to string converting', () => {
            expect(`${childFoo}`).to.be.equal('(//*[@data-test-automation-id=\'root\']' +
                '/descendant::*[substring(@data-test-automation-id, ' +
                'string-length(@data-test-automation-id) - string-length(\'bar\') + 1) = \'bar\' ' +
                'and starts-with(@data-test-automation-id, \'foo\') ' +
                'and string-length(@data-test-automation-id) > 6])[1]');
        });

        it('.toString(true)', () => {
            expect(childFoo.toString(true)).to.be.equal('//*[@data-test-automation-id=\'root\']' +
                '/descendant::*[substring(@data-test-automation-id, ' +
                'string-length(@data-test-automation-id) - string-length(\'bar\') + 1) = \'bar\' ' +
                'and starts-with(@data-test-automation-id, \'foo\') ' +
                'and string-length(@data-test-automation-id) > 6]');
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
                        'parts': [
                            'foo',
                            'bar',
                        ],
                    },
                    'xpath': '/descendant::*[substring(@data-test-automation-id, ' +
                    'string-length(@data-test-automation-id) - string-length(\'bar\') + 1) = \'bar\' ' +
                    'and starts-with(@data-test-automation-id, \'foo\') ' +
                    'and string-length(@data-test-automation-id) > 6]',
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
                'parts': [
                    'foo',
                    'bar',
                ],
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
            expect(childFoo.__reverse()).to.be.equal('root["foo*bar"]');
        });
        it('without root', () => {
            expect(childFoo.__reverse(false)).to.be.equal('["foo*bar"]');
        });
    });
});
