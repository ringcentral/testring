/// <reference types="chrome" />
/* eslint-disable no-console */

import { ExtensionTransportServer } from './extension-transport';
import { ExtensionTransportEvents } from './structs';

const transportServer = new ExtensionTransportServer();

transportServer.on(
    ExtensionTransportEvents.CONNECT,
    (conId) => {
        console.log('CONNECTED', conId);

        transportServer.send(
            conId,
            {
                event: ExtensionTransportEvents.MESSAGE,
                payload: 'hello',
            },
        );
    }
);

transportServer.on(
    ExtensionTransportEvents.DISCONNECT,
    (conId) => {
        console.log('DISCONNECTED', conId);
    }
);

transportServer.on(
    ExtensionTransportEvents.MESSAGE,
    (message) => {
        console.log('MESSAGE', message);
    }
);
