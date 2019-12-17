import { run } from 'testring';

run(async (api) => {
    await api.application.url('http://localhost:8080/alert.html');

    await api.application.alertAccept();
    await api.application.alertDismiss();
    const text = await api.application.alertText();

    const firstAlertState = await api.application.getText(api.application.root.alerts.first);
    const secondAlertState = await api.application.getText(api.application.root.alerts.second);
    const thirdAlertState = await api.application.getText(api.application.root.alerts.third);

    api.application.assert.equal(firstAlertState, 'true');
    api.application.assert.equal(secondAlertState, 'false');
    api.application.assert.equal(thirdAlertState, 'false');
    api.application.assert.equal(text, 'test');
});
