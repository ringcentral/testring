/// <reference types="chrome" />
/* eslint-disable no-console */

import { ExtensionTransportClient } from './extension-transport';
import { ExtensionTransportEvents } from './structs';

const transportClient = new ExtensionTransportClient();

transportClient.on(
    ExtensionTransportEvents.CONNECT,
    () => {
        console.log('CONNECTED');

        transportClient.send({
            event: ExtensionTransportEvents.MESSAGE,
            payload: 'HELLO',
        });
    }
);

transportClient.on(
    ExtensionTransportEvents.DISCONNECT,
    () => {
        console.log('DISCONNECTED');
    }
);

transportClient.on(
    ExtensionTransportEvents.MESSAGE,
    (message) => {
        console.log('MESSAGE', message);
    }
);

document.addEventListener('click', () => {
    transportClient.send({
        event: ExtensionTransportEvents.MESSAGE,
        payload: 'Click!',
    });
});
