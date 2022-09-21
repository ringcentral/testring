import { run } from 'testring';

run(async (api) => {
    await api.application.url('http://localhost:8080/css.html');

    const bgColorFromClass = await api.application.getCssProperty(api.application.root.withClass, 'background-color');
    const bgColorFromStyle = await api.application.getCssProperty(api.application.root.withStyle, 'background-color');

    await api.application.assert.equal(bgColorFromClass, 'rgba(139,0,0,1)'); // necessary what css-property have 'darkred' value in html
    await api.application.assert.equal(bgColorFromStyle, 'rgba(255,0,0,1)'); // necessary what css-property have 'red' value in html

    const isCSSClassExistsFalse = await api.application.isCSSClassExists(
        api.application.root.withStyle, 'customDivClass',
    );
    const isCSSClassExistsTrue = await api.application.isCSSClassExists(
        api.application.root.withClass, 'customDivClass',
    );

    await api.application.assert.equal(isCSSClassExistsFalse, false);
    await api.application.assert.equal(isCSSClassExistsTrue, true);

    // ------------------------------------------------------------------------------

    const isBecomeVisibleElementVisibleNow = await api.application.isVisible(api.application.root.becomeVisible);
    const isBecomeHiddenElementVisibleNow = await api.application.isVisible(api.application.root.becomeHidden);

    await api.application.assert.equal(isBecomeVisibleElementVisibleNow, false);
    await api.application.assert.equal(isBecomeHiddenElementVisibleNow, true);

    await api.application.click(api.application.root.hideVisibleButton);
    const becomeHidden = await api.application.isBecomeHidden(api.application.root.becomeHidden);
    await api.application.assert.equal(becomeHidden, true, 'becomeHidden item should become hidden');

    await api.application.click(api.application.root.showHiddenButton);
    const becomeVisible = await api.application.isBecomeVisible(api.application.root.becomeVisible);
    await api.application.assert.equal(becomeVisible, true, 'becomeVisible item should become visible');
});
