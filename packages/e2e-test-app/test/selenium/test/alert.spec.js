import { run } from 'testring-dev';

run(async (api) => {
    await api.application.url('http://localhost:8080/alert.html');

    if (await api.application.isAlertOpen()) {
        await api.application.alertAccept();
    } else {
        throw Error('Alert is not opened');
    }

    if (await api.application.isAlertOpen()) {
        await api.application.alertDismiss();
    } else {
        throw Error('Alert is not opened');
    }

    const text = await api.application.alertText();

    const firstAlertState = await api.application.getText(api.application.root.alerts.first);
    const secondAlertState = await api.application.getText(api.application.root.alerts.second);
    const thirdAlertState = await api.application.getText(api.application.root.alerts.third);

    api.application.assert.equal(firstAlertState, 'true');
    api.application.assert.equal(secondAlertState, 'false');
    api.application.assert.equal(thirdAlertState, 'false');
    api.application.assert.equal(text, 'test');
});
