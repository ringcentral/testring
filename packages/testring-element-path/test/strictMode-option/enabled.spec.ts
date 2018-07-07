import {expect} from 'chai';
import {createElementPath} from '../../src';


describe('enabled strictMode', () => {
    let empty = createElementPath();

    describe('xpath getter', () => {
        it('call', () => {
            const error = () => empty.xpath('//testerror');
            expect(error).to.throw('Can not use xpath query in strict mode');
        });
    });
});
