/// <reference types="chrome" />

import { MessagingTransportEvents, RecordingEventTypes, RecorderEvents, IExtensionConfig } from '@testring/types';

import { MessagingTransportClient } from './extension/messaging-transport';
import { resolveElementPath } from './extension/resolve-element-path';

const transportClient = new MessagingTransportClient();

transportClient.on(
    RecorderEvents.HANDSHAKE,
    (config: IExtensionConfig) => {
        const { testElementAttribute } = config;

        document.addEventListener('click', (event) => clickHandler(event, testElementAttribute));
    }
);

const clickHandler = (event: Event, attribute: string): void => {
    try {
        const xpath = resolveElementPath(event, attribute);

        if (xpath) {
            transportClient.send({
                event: MessagingTransportEvents.RECORDING_EVENT,
                payload: {
                    type: RecordingEventTypes.CLICK,
                    elementPath: xpath,
                },
            });
        }
    } catch (e) {
        console.warn(e) // eslint-disable-line
    }
};
