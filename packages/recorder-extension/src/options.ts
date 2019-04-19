import { BackgroundChromeClient } from './extension/chrome-transport/chrome-client';
import { IExtensionServersConfiguration } from '@testring/types';

function renderSetterTemplate(data) {
    return `
        <h1>Setting devtool options</h1>
    
        <p>
            Host:
            <span id="host">${data.host}</span>
        </p>
        <p>
            Http port:
            <span id="httpPort">${data.httpPort}</span>
        </p>
        <p>
            WS port:
            <span id="wsPort">${data.wsPort}</span>
        </p>
        <p>
            App id:
            <span id="appId">${data.appId}</span>
        </p>
    `;
}

function dummyPage() {
    return `
        <h1>Do not use this page manually</h1>
    `;
}

function normalizeConfig(config): IExtensionServersConfiguration {
    return {
        host: config.host,
        appId: config.appId,
        httpPort: Number(config.httpPort),
        wsPort: Number(config.wsPort),
    };
}


async function renderPage() {
    const config = new URLSearchParams(window.location.search);

    if (config.has('handshakePage')) {
        const context = {};
        for (let id of ['httpPort', 'wsPort', 'appId', 'host']) {
            context[id] = config.get(id);
        }

        const chromeClient = new BackgroundChromeClient();
        chromeClient.setConfig(normalizeConfig(context));

        document.body.innerHTML = renderSetterTemplate(context);
    } else {
        document.body.innerHTML = dummyPage();
    }
}

document.addEventListener('DOMContentLoaded', function () {
    renderPage();
});


