import {expect} from 'chai';
import {createElementPath} from '../../src';


describe('invalid keys', () => {
    let empty = createElementPath();

    describe('getters', () => {
        it('[\'\']', () => {
            const error = () => empty[''];
            expect(error).to.throw('Key can not me empty');
        });

        it('[\'*foo*bar*\']', () => {
            const error = () => empty['*foo*bar*'];
            expect(error).to.throw('Masks prefix, suffix and inner ask are not supported');
        });

        it('[\'foo*bar*\']', () => {
            const error = () => empty['foo*bar*'];
            expect(error).to.throw('Masks prefix, suffix and inner ask are not supported');
        });

        it('[\'*foo*bar\']', () => {
            const error = () => empty['*foo*bar'];
            expect(error).to.throw('Masks prefix, suffix and inner ask are not supported');
        });

        it('[\'foo*bar*baz\']', () => {
            const error = () => empty['foo*bar*baz'];
            expect(error).to.throw('Masks with more than two parts are not supported');
        });

        it('[\'{}\']', () => {
            const error = () => empty['{}'];
            expect(error).to.throw('Text search param can not be empty');
        });

        it('[\'foo*{}\']', () => {
            const error = () => empty['foo*{}'];
            expect(error).to.throw('Text search param can not be empty');
        });

        it('[\'{}()\']', () => {
            const error = () => empty['{}()'];
            expect(error).to.throw('Text search param can not be empty');
        });

        it('[\'()\']', () => {
            const error = () => empty['()'];
            expect(error).to.throw('Selector can not contain only sub query');
        });

        it('[\'foo*()\']', () => {
            const error = () => empty['foo*()'];
            expect(error).to.throw('Sub Query can not be empty');
        });

        it('[\'(test)\']', () => {
            const error = () => empty['(test)'];
            expect(error).to.throw('Selector can not contain only sub query');
        });

        it('[\'foo*\'][0][0]', () => {
            const error = () => empty['foo*'][0][0];
            expect(error).to.throw('Can not select index element from already sliced element');
        });

        it('[\'foo*\'][\'0\'][0]', () => {
            const error = () => empty['foo*']['0'][0];
            expect(error).to.throw('Can not select index element from already sliced element');
        });

        it('[\'foo*\'][0][\'0\']', () => {
            const error = () => empty['foo*'][0]['0'];
            expect(error).to.throw('Can not select index element from already sliced element');
        });
    });
});
