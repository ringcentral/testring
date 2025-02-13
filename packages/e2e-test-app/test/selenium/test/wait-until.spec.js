import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'wait-until.html'));

    let inputValue = await app.getValue(app.root.inputElement);
    await app.assert.equal(inputValue, '');
    await app.click(app.root.addInputValueButton);
    await app.waitForValue(app.root.inputElement);
    inputValue = await app.getValue(app.root.inputElement);
    await app.assert.equal(inputValue, 'Input Value');

    let isOption2Selected = await app.isChecked(app.root.selectElement.option2);
    await app.assert.equal(isOption2Selected, false);
    await app.click(app.root.addSelectedButton);
    await app.waitForSelected(app.root.selectElement.option2);
    isOption2Selected = await app.isChecked(app.root.selectElement.option2);
    await app.assert.equal(isOption2Selected, true);
});