import { run } from 'testring';

run(async (api) => {
    await api.application.url('http://localhost:8080/wait-for-exist.html');

    await api.application.click(api.application.root.showElement);
    await api.application.waitForExist(api.application.root.shouldExist);

    await api.application.waitForNotExists(api.application.root.invalidTestId, 2000);
});
