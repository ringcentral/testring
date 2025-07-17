import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'title.html'));
    const originalTitle = await app.getTitle();
    await app.assert.equal(originalTitle, 'original title');

    await app.click(app.root.changeTitleButton);
    const newTitle = await app.getTitle();
    await app.assert.equal(newTitle, 'title changed');
});
