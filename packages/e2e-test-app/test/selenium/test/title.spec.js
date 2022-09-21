import { run } from 'testring';

run(async (api) => {
    await api.application.url('http://localhost:8080/title.html');
    const originalTitle = await api.application.getTitle();
    api.application.assert.equal(originalTitle, 'original title');

    await api.application.click(api.application.root.changeTitleButton);
    const newTitle = await api.application.getTitle();
    api.application.assert.equal(newTitle, 'title changed');
});
