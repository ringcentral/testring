import {expect} from 'chai';
import {createElementPath} from '../../src';

describe('Heavy selectors', () => {
    const root = createElementPath();

    it('chain selector', () => {
        const chainChild =
            root.extensionsSelectorPopup.popupContent.extensionsSelectorGrid;

        expect(chainChild.toString()).to.be.equal(
            "(//*[@data-test-automation-id='root']" +
                "//*[@data-test-automation-id='extensionsSelectorPopup']" +
                "//*[@data-test-automation-id='popupContent']" +
                "//*[@data-test-automation-id='extensionsSelectorGrid'])[1]",
        );
    });

    it('__findChildren call', () => {
        const findChildren = root.extensionsSelectorPopup.popupContent.extensionsSelectorGrid.__findChildren(
            {
                prefix: 'extension',
                index: 0,
                subQuery: {
                    exactKey: 'pin',
                    containsText: '101',
                },
            },
        );

        expect(findChildren.toString()).to.be.equal(
            "(//*[@data-test-automation-id='root']" +
                "//*[@data-test-automation-id='extensionsSelectorPopup']" +
                "//*[@data-test-automation-id='popupContent']" +
                "//*[@data-test-automation-id='extensionsSelectorGrid']" +
                "/descendant::*[starts-with(@data-test-automation-id, 'extension') " +
                'and descendant::*[@data-test-automation-id=\'pin\' and contains(., "101")]][position() = 1])[1]',
        );
    });

    it('__findChildren call after indexed element', () => {
        const findChildren = root.extensionsSelectorPopup.popupContent.extensionsSelectorGrid.row[0].__findChildren(
            {
                prefix: 'extension',
                index: 0,
                subQuery: {
                    exactKey: 'pin',
                    containsText: '101',
                },
            },
        );

        expect(findChildren.toString()).to.be.equal(
            "(//*[@data-test-automation-id='root']" +
                "//*[@data-test-automation-id='extensionsSelectorPopup']" +
                "//*[@data-test-automation-id='popupContent']" +
                "//*[@data-test-automation-id='extensionsSelectorGrid']" +
                "/descendant::*[@data-test-automation-id='row'][position() = 1]" +
                "/descendant::*[starts-with(@data-test-automation-id, 'extension') " +
                'and descendant::*[@data-test-automation-id=\'pin\' and contains(., "101")]][position() = 1])[1]',
        );
    });
});
