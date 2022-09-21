import { run } from 'testring';

run(async (api) => {
    await api.application.url('http://localhost:8080/form.html');

    const isEnabledForEnabled = await api.application.isEnabled(api.application.root.form.nameInput);
    const isEnabledForDisabled = await api.application.isEnabled(api.application.root.form.disabledInput);
    await api.application.assert.equal(isEnabledForEnabled, true);
    await api.application.assert.equal(isEnabledForDisabled, false);

    const isDisabledForEnabled = await api.application.isDisabled(api.application.root.form.nameInput);
    const isDisabledForDisabled = await api.application.isDisabled(api.application.root.form.disabledInput);
    await api.application.assert.equal(isDisabledForEnabled, false);
    await api.application.assert.equal(isDisabledForDisabled, true);
    
    // readonly

    const isReadonlyForWriteable = await api.application.isReadOnly(api.application.root.form.nameInput);
    const isReadonlyForReadonly = await api.application.isReadOnly(api.application.root.form.readonlyInput);
    await api.application.assert.equal(isReadonlyForReadonly, true);
    await api.application.assert.equal(isReadonlyForWriteable, false);

    // checkbox

    const isInitialCheckedShouldFalse = await api.application.isChecked(api.application.root.form.checkbox);
    const isInitialCheckedShouldTrue = await api.application.isChecked(api.application.root.form.checkbox_2);

    await api.application.assert.equal(isInitialCheckedShouldTrue, true);
    await api.application.assert.equal(isInitialCheckedShouldFalse, false);

    await api.application.setChecked(api.application.root.form.checkbox, true);
    await api.application.setChecked(api.application.root.form.checkbox_2, false);

    const afterSetCheckedIsCheckedShouldTrue = await api.application.isChecked(api.application.root.form.checkbox);
    const afterSetCheckedIsCheckedShouldFalse = await api.application.isChecked(api.application.root.form.checkbox_2);

    await api.application.assert.equal(afterSetCheckedIsCheckedShouldTrue, true);
    await api.application.assert.equal(afterSetCheckedIsCheckedShouldFalse, false);

    // inputs

    const initialValueOfEmptyInput = await api.application.getValue(api.application.root.form.nameInput);
    const initialValueOfInputWithDefaultValue = await api.application.getValue(api.application.root.form.readonlyInput);

    await api.application.assert.equal(initialValueOfEmptyInput, '');
    await api.application.assert.equal(initialValueOfInputWithDefaultValue, 'readonly');

    await api.application.setValue(api.application.root.form.nameInput, 'testValue');
    const afterSetValue = await api.application.getValue(api.application.root.form.nameInput);
    await api.application.assert.equal(afterSetValue, 'testValue');

    await api.application.clearElement(api.application.root.form.nameInput);
    const afterClearValue = await api.application.getValue(api.application.root.form.nameInput);
    await api.application.assert.equal(afterClearValue, '');

    // placeholder
    const nameInputPlaceholder = await api.application.getPlaceHolderValue(api.application.root.form.nameInput);
    await api.application.assert.equal(nameInputPlaceholder, 'name');
});
