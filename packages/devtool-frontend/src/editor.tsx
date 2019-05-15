import * as React from 'react';
import { render } from 'react-dom';

import { ClientWsTransport } from '@testring/client-ws-transport';

import { EditorLayout } from './components/editor-layout';

async function init() {
    const config = (window as any).testRingDevtoolConfig;

    const wsClient = new ClientWsTransport(config.host, config.wsPort);
    wsClient.connect();
    await wsClient.handshake(config.appId);

    render(
        <EditorLayout wsClient={wsClient} />,
        document.getElementById('editorBlock'),
    );
}

init();
