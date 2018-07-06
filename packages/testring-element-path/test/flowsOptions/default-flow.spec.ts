import {expect} from 'chai';
import {createElementPath} from '../../src';

const {
    getDescriptor,
    getPrivateDescriptor,

    checkAccessMethods,
    checkPreventExtensions,
    checkProperty,
} = require('../utils');


describe('flows option default behavior', () => {
    const runFlow = async () => 'test string';
    let root = createElementPath({
        flows: {
            foo: {
                runFlow,
            },
        },
    });
    let childFoo = root.foo;

    describe('basic Object methods', () => {
        it('.toString()', () => {
            expect(childFoo.toString()).to.be.equal('(//*[@data-test-automation-id=\'root\']' +
                '//*[@data-test-automation-id=\'foo\'])[1]');
        });

        it('to string converting', () => {
            expect(`${childFoo}`).to.be.equal('(//*[@data-test-automation-id=\'root\']' +
                '//*[@data-test-automation-id=\'foo\'])[1]');
        });

        it('.toString(true)', () => {
            expect(childFoo.toString(true)).to.be.equal('//*[@data-test-automation-id=\'root\']' +
                '//*[@data-test-automation-id=\'foo\']');
        });

        checkAccessMethods(childFoo, {
            keys: ['__flows', '__path', 'runFlow'],
        });
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
                        'exactKey': 'foo',
                    },
                    'xpath': '//*[@data-test-automation-id=\'foo\']',
                },
            ]),
        });
    });
    describe('.__flows property traps', () => {
        checkProperty({
            object: childFoo,
            key: '__flows',
            valueDescriptor: getDescriptor({
                runFlow,
            }),
        });
    });

    // Private properties
    describe('.__searchOptions property traps', () => {
        checkProperty({
            object: childFoo,
            key: '__searchOptions',
            valueDescriptor: getPrivateDescriptor({
                'exactKey': 'foo',
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

    // Checking flows inheritance
    describe('.runFlow property traps', () => {
        checkProperty({
            object: childFoo,
            key: 'runFlow',
            valueDescriptor: getDescriptor(runFlow),
        });

        it('function call', async () => {
            expect(await childFoo.runFlow()).to.be.equal('test string');
        });
    });
});
