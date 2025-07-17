import {run} from 'testring';
import {getTargetUrl} from '../utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'timezone.html'));

    let currentTimezone = await app.getText(app.root.timezone.value);

    await app.assert.notEqual(currentTimezone, 'Asia/Tokyo');

    await app.setTimeZone('Asia/Tokyo');
    await app.refresh();

    let newTimezone = await app.getText(app.root.timezone.value);
    await app.assert.equal(newTimezone, 'Asia/Tokyo');
});