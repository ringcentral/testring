import { run } from 'testring-dev';

const expectedHtml = '<div data-test-automation-id="container"><p>test</p></div>';

run(async (api) => {
    await api.application.url('http://localhost:8080/html-and-text.html');
    const html = await api.application.getHTML(api.application.root.container);
    await api.application.assert.equal(html, expectedHtml);

    const text = await api.application.getText(api.application.root.text);
    await api.application.assert.equal(text, 'Text is here!');

    const texts = await api.application.getTexts(api.application.root.texts);
    await api.application.assert.deepEqual(texts[0].split('\n'), ['Text 1', 'Text 2', 'Text 3', 'Text 4']);

    const textWithoutFocus = await api.application.getTextWithoutFocus(api.application.root.textWithoutFocus);
    await api.application.assert.equal(textWithoutFocus, 'Text without focus');
});
