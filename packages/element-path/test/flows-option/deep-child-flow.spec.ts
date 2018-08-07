import { expect } from 'chai';
import { createElementPath } from '../../src';

const {
    getDescriptor,

    checkProperty
} = require('../utils');


describe('flows option on deep child', () => {
    const foo = async () => 'test string foo';
    const bar = () => 'test string bar';
    let root = createElementPath({
        flows: {
            deepChild: {
                foo: foo,
                bar: bar
            }
        }
    });
    let deepChildFoo = root.foo.bar.baz[1].let[0].it[0].be[0].let[1].it[1].be[1].deepChild;

    describe('.__flows property traps', () => {
        checkProperty({
            object: deepChildFoo,
            key: '__flows',
            valueDescriptor: getDescriptor({
                foo: foo,
                bar: bar
            })
        });
    });

    // Checking flows inheritance
    describe('.foo property traps', () => {
        checkProperty({
            object: deepChildFoo,
            key: 'foo',
            valueDescriptor: getDescriptor(foo)
        });

        it('function call', async () => {
            expect(await deepChildFoo.foo()).to.be.equal('test string foo');
        });
    });
    describe('.bar property traps', () => {
        checkProperty({
            object: deepChildFoo,
            key: 'bar',
            valueDescriptor: getDescriptor(bar)
        });

        it('function call', () => {
            expect(deepChildFoo.bar()).to.be.equal('test string bar');
        });
    });
});
