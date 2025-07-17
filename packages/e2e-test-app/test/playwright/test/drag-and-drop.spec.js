import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'drag-and-drop.html'));

    let isDraggable1Visible = await app.isVisible(app.root.draggable1);
    let isDropZone2Visible = await app.isVisible(app.root.dropzone2);

    await app.assert.equal(isDraggable1Visible && isDropZone2Visible, true);

    await app.dragAndDrop(app.root.draggable1, app.root.dropzone2);

    let isDroppedElementVisible = await app.isVisible(app.root.dropzone2.draggable1);

    await app.assert.equal(isDroppedElementVisible, true);

});