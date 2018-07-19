/// <reference types="chrome" />

import { MessagingTransportEvents, RecordingEventTypes, RecorderEvents, IExtensionConfig } from '@testring/types';

import { MessagingTransportClient } from './extension/messaging-transport';
import { resolveElementPath } from './extension/resolve-element-path';

const transportClient = new MessagingTransportClient();

let clickHandlerFunc = (event) => {};

transportClient.on(
    RecorderEvents.HANDSHAKE,
    (config: IExtensionConfig) => {
        const { testElementAttribute } = config;

        document.removeEventListener('click', clickHandlerFunc);

        clickHandlerFunc = (event) => clickHandler(event, testElementAttribute);

        document.addEventListener('click', clickHandlerFunc);
    }
);

const clickHandler = (event: MouseEvent, attribute: string): void => {
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
