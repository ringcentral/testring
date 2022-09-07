import * as React from 'react';
import { render } from 'react-dom';

import { ClientWsTransport } from '@testring-dev/client-ws-transport';

import { PopupWsProvider } from './containers/popup-ws-provider';

async function init() {
    const config = (window as any).rcRecorderConfig;

    const wsClient = new ClientWsTransport(config.host, config.wsPort);
    wsClient.connect();
    await wsClient.handshake(config.appId);


    render(
        <PopupWsProvider wsClient={wsClient} />,
        document.getElementById('rcRecorderApp'),
    );
}

init();
