import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'form.html'));

    await app.selectByValue(app.root.form.select, 'byValue');
    const byValueText = await app.getSelectedText(app.root.form.select);
    await app.assert.equal(byValueText, 'By value');

    await app.selectByAttribute(
        app.root.form.select,
        'data-test-attr',
        'value',
    );
    const byAttributeText = await app.getSelectedText(app.root.form.select);
    await app.assert.equal(byAttributeText, 'By attribute');

    await app.selectByIndex(app.root.form.select, 2);
    const byIndexText = await app.getSelectedText(app.root.form.select);
    await app.assert.equal(byIndexText, 'By index');

    await app.selectByVisibleText(app.root.form.select, 'By visible text');
    const byVisibleText = await app.getSelectedText(app.root.form.select);
    await app.assert.equal(byVisibleText, 'By visible text');

    const previousText = await app.getSelectedText(app.root.form.select);
    await app.selectNotCurrent(app.root.form.select);
    const nonCurrentText = await app.getSelectedText(app.root.form.select);
    await app.assert.notEqual(nonCurrentText, previousText);

    const selectTexts = await app.getSelectTexts(app.root.form.select);
    const selectValues = await app.getSelectValues(app.root.form.select);

    await app.assert.deepEqual(selectTexts, [
        'By attribute',
        'By name',
        'By index',
        'By value',
        'By visible text',
        'With test id',
    ]);
    await app.assert.deepEqual(selectValues, [
        'byAttribute',
        'byName',
        'byIndex',
        'byValue',
        'byVisibleText',
        'withTestId',
    ]);
});
