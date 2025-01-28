import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'click.html'));

    await app.click(app.root.button);

    const outputText = await app.getText(app.root.output);
    await app.assert.equal(outputText, 'success');

    try {
        await app.clickCoordinates(app.root.halfHoveredButton, {x: 0, y: 0});
        throw Error('Test failed');
    } catch (e) {
        /* ignore */
    }

    await app.click(app.root.halfHoveredOverlay);
    await app.clickCoordinates(app.root.halfHoveredButton, {
        x: 'right',
        y: 'center',
    });

    const halfHoveredOutputText = await app.getText(app.root.halfHoveredOutput);
    await app.assert.equal(halfHoveredOutputText, 'success');

    try {
        await app.clickCoordinates(app.root.partiallyHoveredButton, {
            x: 0,
            y: 0,
        });
        throw Error('Test failed');
    } catch (e) {
        /* ignore */
    }

    await app.click(app.root.partiallyHoveredOverlay);
    await app.clickButton(app.root.partiallyHoveredButton);

    const partiallyHoveredOutputText = await app.getText(
        app.root.partiallyHoveredOutput,
    );
    await app.assert.equal(partiallyHoveredOutputText, 'success');
});
