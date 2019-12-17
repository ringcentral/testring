import { run } from 'testring';

run(async (api) => {
    await api.application.url('http://localhost:8080/form.html');

    await api.application.selectByValue(api.application.root.form.select, 'byValue');
    const byValueText = await api.application.getSelectedText(api.application.root.form.select);
    api.application.assert.equal(byValueText, 'By value');

    await api.application.selectByAttribute(api.application.root.form.select, 'data-test-attr', 'value');
    const byAttributeText = await api.application.getSelectedText(api.application.root.form.select);
    api.application.assert.equal(byAttributeText, 'By attribute');

    await api.application.selectByIndex(api.application.root.form.select, 2);
    const byIndexText = await api.application.getSelectedText(api.application.root.form.select);
    api.application.assert.equal(byIndexText, 'By index');

    await api.application.selectByVisibleText(api.application.root.form.select, 'By visible text');
    const byVisibleText = await api.application.getSelectedText(api.application.root.form.select);
    api.application.assert.equal(byVisibleText, 'By visible text');

    const previousText = await api.application.getSelectedText(api.application.root.form.select);
    await api.application.selectNotCurrent(api.application.root.form.select);
    const nonCurrentText = await api.application.getSelectedText(api.application.root.form.select);
    await api.application.assert.notEqual(nonCurrentText, previousText);

    const selectTexts = await api.application.getSelectTexts(api.application.root.form.select);
    const selectValues = await api.application.getSelectValues(api.application.root.form.select);

    await api.application.assert.deepEqual(selectTexts, [
        'By attribute', 'By name', 'By index', 'By value', 'By visible text', 'With test id',
    ]);
    await api.application.assert.deepEqual(selectValues, [
        'byAttribute', 'byName', 'byIndex', 'byValue', 'byVisibleText', 'withTestId',
    ]);

    await api.application.selectByName(api.application.root.form.select, 'testName');
    const byNameText = await api.application.getSelectedText(api.application.root.form.select);
    api.application.assert.equal(byNameText, 'By name');
});
