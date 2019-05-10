import * as React from 'react';
import { render } from 'react-dom';

import { ClientWsTransport } from '@testring/client-ws-transport';

import { PopupWsProvider } from './containers/popup-ws-provider';

async function init() {
    const config = (window as any).testRingDevtoolConfig;

    const wsClient = new ClientWsTransport(config.host, config.wsPort);
    wsClient.connect();
    await wsClient.handshake(config.appId);


    render(
        <PopupWsProvider wsClient={wsClient} />,
        document.getElementById('popupBlock'),
    );
}

init();
