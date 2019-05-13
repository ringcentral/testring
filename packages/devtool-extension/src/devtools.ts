/// <reference types="chrome" />

import { BackgroundChromeClient } from './extension/chrome-transport/chrome-client';


chrome.devtools.panels.create(
    'TestRing',
    'icon.png',
    'devtools-panel.html',
    (panel) => {
        let initialized = false;

        panel.onShown.addListener(async (window) => {
            if (initialized) {
                return false;
            }

            const client = new BackgroundChromeClient();

            await client.waitForReady();
            const { host, httpPort, appId } = client.getConfig();

            window.document.body.innerHTML = `<iframe src="http://${host}:${httpPort}/editor?appId=${appId}"></iframe>`;
            initialized = true;
        });
    }
);
