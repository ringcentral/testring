import {expect} from 'chai';
import {createElementPath} from '../../src';

describe('flows option function context behavior', () => {
    function getContext() {
        return this;
    }

    const root = createElementPath({
        flows: {
            foo: {
                getContext,
            },
        },
    });
    const childFoo = root.foo;

    it('Call chidlFoo.getContext()', () => {
        expect(childFoo.getContext()).to.be.equal(childFoo.__proxy);
        expect(childFoo.getContext().__getInstance()).to.be.equal(
            childFoo.__getInstance(),
        );
    });

    it('Call childFoo.getContext.apply(obj)', () => {
        const obj = {};
        expect(childFoo.getContext.apply(obj)).to.be.equal(obj);
    });

    it('Call getContext()', () => {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const {getContext} = childFoo;
        expect(getContext()).to.be.equal(undefined);
    });
});
