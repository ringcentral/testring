/// <reference types="chrome" />
/* eslint-disable no-console */

import { MessagingTransportClient } from './messaging-transport';
import { MessagingTransportEvents } from './structs';

const transportClient = new MessagingTransportClient();

transportClient.on(
    MessagingTransportEvents.CONNECT,
    () => {
        console.log('CONNECTED');

        transportClient.send({
            event: MessagingTransportEvents.MESSAGE,
            payload: 'HELLO',
        });
    }
);

transportClient.on(
    MessagingTransportEvents.DISCONNECT,
    () => {
        console.log('DISCONNECTED');
    }
);

transportClient.on(
    MessagingTransportEvents.MESSAGE,
    (message) => {
        console.log('MESSAGE', message);
    }
);

document.addEventListener('click', () => {
    transportClient.send({
        event: MessagingTransportEvents.MESSAGE,
        payload: 'Click!',
    });
});
