/// <reference types="chrome" />

import { BackgroundChromeClient } from './extension/chrome-transport/chrome-client';

const client = new BackgroundChromeClient();

async function init() {
    await client.waitForReady();
    // TODO rewraite handlers
    // eslint-disable-next-line no-console
    console.log(client.getConfig());
}

init();
