import { run } from 'testring-dev';

run(async (api) => {
    await api.application.url('http://localhost:8080/click.html');

    await api.application.click(api.application.root.button);

    const outputText = await api.application.getText(api.application.root.output);
    api.application.assert.equal(outputText, 'success');

    try {
        await api.application.clickCoordinates(api.application.root.halfHoveredButton, { x: 0, y: 0 });
        throw Error('Test failed');
    } catch (e) { /* ignore */ }

    await api.application.click(api.application.root.halfHoveredOverlay);
    await api.application.clickCoordinates(api.application.root.halfHoveredButton, { x: 'right', y: 'center' });

    const halfHoveredOutputText = await api.application.getText(api.application.root.halfHoveredOutput);
    api.application.assert.equal(halfHoveredOutputText, 'success');


    try {
        await api.application.clickCoordinates(api.application.root.partiallyHoveredButton, { x: 0, y: 0 });
        throw Error('Test failed');
    } catch (e) { /* ignore */ }

    await api.application.click(api.application.root.partiallyHoveredOverlay);
    await api.application.clickButton(api.application.root.partiallyHoveredButton);

    const partiallyHoveredOutputText = await api.application.getText(api.application.root.partiallyHoveredOutput);
    api.application.assert.equal(partiallyHoveredOutputText, 'success');
});
