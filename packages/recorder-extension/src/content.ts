/// <reference types="chrome" />

import { MessagingTransportEvents, RecordingEventTypes, RecorderEvents, IExtensionConfig } from '@testring/types';

import { MessagingTransportClient } from './extension/messaging-transport';
import { getAffectedElementsSummary } from './extension/get-affected-elements-summary';

const transportClient = new MessagingTransportClient();

let clickHandlerFunc = (event) => {};

const clickHandler = (event: MouseEvent): void => {
    try {
        const elementsSummary = getAffectedElementsSummary(event);

        if (elementsSummary) {
            transportClient.send({
                event: MessagingTransportEvents.RECORDING_EVENT,
                payload: {
                    type: RecordingEventTypes.CLICK,
                    elementsSummary,
                },
            });
        }
    } catch (e) {
        console.warn(e) // eslint-disable-line
    }
};

transportClient.on(
    RecorderEvents.HANDSHAKE,
    (config: IExtensionConfig) => {
        document.removeEventListener('click', clickHandlerFunc);

        clickHandlerFunc = (event) => clickHandler(event);

        document.addEventListener('click', clickHandlerFunc);
    }
);
