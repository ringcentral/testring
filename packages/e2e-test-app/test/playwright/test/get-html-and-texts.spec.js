import {run} from 'testring';
import {getTargetUrl} from './utils';

const expectedHtml =
    '<div data-test-automation-id="container"><p>test</p></div>';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'html-and-text.html'));
    const html = await app.getHTML(app.root.container);
    await app.assert.equal(html, expectedHtml);

    const text = await app.getText(app.root.text);
    await app.assert.equal(text, 'Text is here!');

    // Get text without focus first, before any mouseover events
    const textWithoutFocus = await app.getTextWithoutFocus(
        app.root.textWithoutFocus,
    );
    await app.assert.equal(textWithoutFocus, 'Text without focus');

    // Then explicitly trigger the mouseover event to add "Text 4" to texts element
    await app.execute(() => {
        const textsDiv = document.getElementById('texts');
        if (textsDiv && textsDiv.onmouseover) {
            textsDiv.onmouseover();
        }
    });

    const texts = await app.getTexts(app.root.texts);
    // Split by newline and trim each line to remove extra spaces
    const cleanedTexts = texts[0].split('\n').map(line => line.trim()).filter(line => line);
    await app.assert.deepEqual(cleanedTexts, [
        'Text 1',
        'Text 2',
        'Text 3',
        'Text 4',
    ]);
});
