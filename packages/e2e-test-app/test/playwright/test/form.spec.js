import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'form.html'));

    const isEnabledForEnabled = await app.isEnabled(app.root.form.nameInput);
    const isEnabledForDisabled = await app.isEnabled(
        app.root.form.disabledInput,
    );
    await app.assert.equal(isEnabledForEnabled, true);
    await app.assert.equal(isEnabledForDisabled, false);

    const isDisabledForEnabled = await app.isDisabled(app.root.form.nameInput);
    const isDisabledForDisabled = await app.isDisabled(
        app.root.form.disabledInput,
    );
    await app.assert.equal(isDisabledForEnabled, false);
    await app.assert.equal(isDisabledForDisabled, true);

    // readonly

    const isReadonlyForWriteable = await app.isReadOnly(
        app.root.form.nameInput,
    );
    const isReadonlyForReadonly = await app.isReadOnly(
        app.root.form.readonlyInput,
    );
    await app.assert.equal(isReadonlyForReadonly, true);
    await app.assert.equal(isReadonlyForWriteable, false);

    // checkbox

    const isInitialCheckedShouldFalse = await app.isChecked(
        app.root.form.checkbox,
    );
    const isInitialCheckedShouldTrue = await app.isChecked(
        app.root.form.checkbox_2,
    );

    await app.assert.equal(isInitialCheckedShouldTrue, true);
    await app.assert.equal(isInitialCheckedShouldFalse, false);

    await app.setChecked(app.root.form.checkbox, true);
    await app.setChecked(app.root.form.checkbox_2, false);

    const afterSetCheckedIsCheckedShouldTrue = await app.isChecked(
        app.root.form.checkbox,
    );
    const afterSetCheckedIsCheckedShouldFalse = await app.isChecked(
        app.root.form.checkbox_2,
    );

    await app.assert.equal(afterSetCheckedIsCheckedShouldTrue, true);
    await app.assert.equal(afterSetCheckedIsCheckedShouldFalse, false);

    // inputs

    const initialValueOfEmptyInput = await app.getValue(
        app.root.form.nameInput,
    );
    const initialValueOfInputWithDefaultValue = await app.getValue(
        app.root.form.readonlyInput,
    );

    await app.assert.equal(initialValueOfEmptyInput, '');
    await app.assert.equal(initialValueOfInputWithDefaultValue, 'readonly');

    await app.setValue(app.root.form.nameInput, 'testValue');
    let afterSetValue = await app.getValue(app.root.form.nameInput);
    await app.assert.equal(afterSetValue, 'testValue');

    await app.clearElement(app.root.form.nameInput);
    let afterClearValue = await app.getValue(app.root.form.nameInput);
    await app.assert.equal(afterClearValue, '');

    await app.setValue(app.root.form.nameInput, 'testValueNew');
    afterSetValue = await app.getValue(app.root.form.nameInput);
    await app.assert.equal(afterSetValue, 'testValueNew');
    await app.clearValue(app.root.form.nameInput);
    afterClearValue = await app.getValue(app.root.form.nameInput);
    await app.assert.equal(afterClearValue, '');

    // placeholder
    const nameInputPlaceholder = await app.getPlaceHolderValue(
        app.root.form.nameInput,
    );
    await app.assert.equal(nameInputPlaceholder, 'name');

    // keys
    await app.setValue(app.root.form.nameInput, 'testValueKeys');
    afterSetValue = await app.getValue(app.root.form.nameInput);
    await app.assert.equal(afterSetValue, 'testValueKeys');
    await app.click(app.root.form.nameInput);
    // Use Meta+A (Command+A) on macOS instead of Control+A
    const isMac = process.platform === 'darwin';
    await app.keys([isMac ? 'Meta' : 'Control', 'A']);
    await app.keys(['Backspace']);
    afterClearValue = await app.getValue(app.root.form.nameInput);
    await app.assert.equal(afterClearValue, '');

    // addValue
    await app.addValue(app.root.form.nameInput, 'testValueAdd');
    await app.addValue(app.root.form.nameInput, '123'); // Convert number to string
    afterSetValue = await app.getValue(app.root.form.nameInput);
    await app.assert.equal(afterSetValue, 'testValueAdd123');
});
