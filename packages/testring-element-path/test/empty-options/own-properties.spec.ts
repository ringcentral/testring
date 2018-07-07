import {expect} from 'chai';
import {createElementPath} from '../../src';


describe('own properties', () => {
    let empty = createElementPath();

    it('.flows is hidden', () => {
       expect(empty.flows.toString()).to.be.equal(
           '(//*[@data-test-automation-id=\'root\']//*[@data-test-automation-id=\'flows\'])[1]'
       );
    });

    it('.regexp is hidden', () => {
        expect(empty.regexp.toString()).to.be.equal(
            '(//*[@data-test-automation-id=\'root\']//*[@data-test-automation-id=\'regexp\'])[1]'
        );
    });

    it('.attributeName is hidden', () => {
        expect(empty.attributeName.toString()).to.be.equal(
            '(//*[@data-test-automation-id=\'root\']//*[@data-test-automation-id=\'attributeName\'])[1]'
        );
    });

    it('.searchMask is hidden', () => {
        expect(empty.searchMask.toString()).to.be.equal(
            '(//*[@data-test-automation-id=\'root\']//*[@data-test-automation-id=\'searchMask\'])[1]'
        );
    });

    it('.searchOptions is hidden', () => {
        expect(empty.searchOptions.toString()).to.be.equal(
            '(//*[@data-test-automation-id=\'root\']//*[@data-test-automation-id=\'searchOptions\'])[1]'
        );
    });

    it('.parent is hidden', () => {
        expect(empty.parent.toString()).to.be.equal(
            '(//*[@data-test-automation-id=\'root\']//*[@data-test-automation-id=\'parent\'])[1]'
        );
    });
});
