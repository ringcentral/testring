/// <reference types="chrome" />

import { MessagingTransportClient } from './extension/messaging-transport';
import { MessagingTransportEvents, RecordingEventTypes } from './structs';
import { resolveElementPath } from './extension/resolve-element-path';

const transportClient = new MessagingTransportClient();

transportClient.on(
    MessagingTransportEvents.CONNECT,
    () => {
        document.addEventListener('click', clickHandler);
    }
);

transportClient.on(
    MessagingTransportEvents.DISCONNECT,
    () => {
        document.removeEventListener('click', clickHandler);
    }
);

const clickHandler = (event: Event) => {
    const xpath = resolveElementPath(event);

    if (xpath) {
        transportClient.send({
            event: MessagingTransportEvents.RECORDING_EVENT,
            payload: {
                type: RecordingEventTypes.CLICK,
                elementPath: xpath,
            },
        });
    }
};
