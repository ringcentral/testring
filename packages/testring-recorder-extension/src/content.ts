/// <reference types="chrome" />

import { MessagingTransportClient } from './extension/messaging-transport';
import { MessagingTransportEvents, RecordingEventTypes } from './structs';
import { resolveElementPath } from './extension/resolve-element-path';

const transportClient = new MessagingTransportClient();

document.addEventListener('click', (event) => {
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
});
