/// <reference types="chrome" />

import { IExtensionConfig, MessagingTransportEvents, RecorderEvents, RecordingEventTypes } from '@testring/types';

import { MessagingTransportClient } from './extension/messaging-transport';
import { getAffectedElementsSummary, getElementsSummary } from './extension/elements-summary';

const transportClient = new MessagingTransportClient();

const eventHandler = (event: Event, type: RecordingEventTypes): void => {
    try {
        const affectedElementsSummary = getAffectedElementsSummary(event);
        const domSummary = getElementsSummary([document.body]);

        if (affectedElementsSummary) {
            transportClient.send({
                event: MessagingTransportEvents.RECORDING_EVENT,
                payload: {
                    type,
                    affectedElementsSummary,
                    domSummary,
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
        document.addEventListener('click', (event) => eventHandler(event, RecordingEventTypes.CLICK));

        Array.from(document.querySelectorAll('input')).forEach((input) => {
            input.addEventListener('change', (event) => eventHandler(event, RecordingEventTypes.CHANGE));
        });
    }
);
