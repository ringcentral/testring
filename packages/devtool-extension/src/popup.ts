import {IExtensionApplicationConfig} from '@testring/types';
import {BackgroundChromeClient} from './extension/chrome-transport/chrome-client';

const client = new BackgroundChromeClient();

function renderPopup(config: IExtensionApplicationConfig) {
    const iframe = document.createElement('iframe');

    Object.assign(iframe.style, {
        height: '100px',
        width: '250px',
        border: 0,
    });

    iframe.src = `http://${config.host}:${config.httpPort}/popup?appId=${config.appId}`;

    document.body.innerHTML = '';

    document.body.appendChild(iframe);
}

function renderError(error) {
    document.body.innerText = `${error.message}`;
}

async function init() {
    await client.waitForReady();
    const config = client.getConfig();
    renderPopup(config);
}

document.addEventListener('DOMContentLoaded', function () {
    init().catch((error) => renderError(error));
});
