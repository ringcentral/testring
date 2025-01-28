import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'css.html'));

    const bgColorFromClass = await app.getCssProperty(
        app.root.withClass,
        'background-color',
    );
    const bgColorFromStyle = await app.getCssProperty(
        app.root.withStyle,
        'background-color',
    );

    await app.assert.equal(bgColorFromClass, 'rgba(139,0,0,1)'); // necessary what css-property have 'darkred' value in html
    await app.assert.equal(bgColorFromStyle, 'rgba(255,0,0,1)'); // necessary what css-property have 'red' value in html

    const isCSSClassExistsFalse = await app.isCSSClassExists(
        app.root.withStyle,
        'customDivClass',
    );
    const isCSSClassExistsTrue = await app.isCSSClassExists(
        app.root.withClass,
        'customDivClass',
    );

    await app.assert.equal(isCSSClassExistsFalse, false);
    await app.assert.equal(isCSSClassExistsTrue, true);

    // ------------------------------------------------------------------------------

    const isBecomeVisibleElementVisibleNow = await app.isVisible(
        app.root.becomeVisible,
    );
    const isBecomeHiddenElementVisibleNow = await app.isVisible(
        app.root.becomeHidden,
    );

    await app.assert.equal(isBecomeVisibleElementVisibleNow, false);
    await app.assert.equal(isBecomeHiddenElementVisibleNow, true);

    await app.click(app.root.hideVisibleButton);
    const becomeHidden = await app.isBecomeHidden(app.root.becomeHidden);
    await app.assert.equal(
        becomeHidden,
        true,
        'becomeHidden item should become hidden',
    );

    await app.click(app.root.showHiddenButton);
    const becomeVisible = await app.isBecomeVisible(app.root.becomeVisible);
    await app.assert.equal(
        becomeVisible,
        true,
        'becomeVisible item should become visible',
    );
});
