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

    const texts = await app.getTexts(app.root.texts);
    await app.assert.deepEqual(texts[0].split('\n'), [
        'Text 1',
        'Text 2',
        'Text 3',
        'Text 4',
    ]);

    const textWithoutFocus = await app.getTextWithoutFocus(
        app.root.textWithoutFocus,
    );
    await app.assert.equal(textWithoutFocus, 'Text without focus');
});
