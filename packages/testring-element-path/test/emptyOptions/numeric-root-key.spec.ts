import {expect} from 'chai';
import {createElementPath} from '../../src';


describe('empty options ElementPath root[0]', () => {
    let empty = createElementPath();

    it('error handling for root numeric path', () => {
        const getter = () => empty[0];
        expect(getter).to.throw('Root Element is not enumerable');
    });

    it('error handling for root string numeric path', () => {
        const getter = () => empty['0'];
        expect(getter).to.throw('Root Element is not enumerable');
    });
});
