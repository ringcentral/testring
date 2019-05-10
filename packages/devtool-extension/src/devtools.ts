/// <reference types="chrome" />

import { BackgroundChromeClient } from './extension/chrome-transport/chrome-client';


chrome.devtools.panels.create(
    'TestRing',
    'icon.png',
    'devtools-panel.html',
    (panel) => {
        panel.onShown.addListener(async (window) => {
            const client = new BackgroundChromeClient();

            await client.waitForReady();
            const { host, httpPort, appId } = client.getConfig();

            window.document.body.innerHTML = `<iframe src="http://${host}:${httpPort}/editor?appId=${appId}"></iframe>`;
        });
    }
);
