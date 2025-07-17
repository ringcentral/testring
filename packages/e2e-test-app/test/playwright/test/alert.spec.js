import {run} from 'testring';
import {getTargetUrl} from './utils';

run(async (api) => {
    let app = api.application;
    await app.url(getTargetUrl(api, 'alert.html'));

    if (await app.isAlertOpen()) {
        await app.alertAccept();
    } else {
        throw Error('Alert is not opened');
    }

    if (await app.isAlertOpen()) {
        await app.alertDismiss();
    } else {
        throw Error('Alert is not opened');
    }

    const text = await app.alertText();

    const firstAlertState = await app.getText(app.root.alerts.first);
    const secondAlertState = await app.getText(app.root.alerts.second);
    const thirdAlertState = await app.getText(app.root.alerts.third);

    await app.assert.equal(firstAlertState, 'true');
    await app.assert.equal(secondAlertState, 'false');
    await app.assert.equal(thirdAlertState, 'false');
    await app.assert.equal(text, 'test');
});
