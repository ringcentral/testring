import { run } from 'testring';

run(async (api) => {
    await api.application.url('http://localhost:8080/click.html');

    await api.application.click(
        api.application.root.button
    );

    const outputText = await api.application.getText(api.application.root.output);
    api.application.assert.equal(outputText, 'test');
});
