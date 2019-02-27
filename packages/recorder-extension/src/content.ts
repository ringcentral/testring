/// <reference types="chrome" />

import { MessagingTransportEvents, RecordingEventTypes, RecorderEvents, IExtensionConfig } from '@testring/types';

import { MessagingTransportClient } from './extension/messaging-transport';
import { getAffectedElementsSummary, getElementsSummary } from './extension/elements-summary';

const transportClient = new MessagingTransportClient();

let clickHandlerFunc = (event) => {};

const clickHandler = (event: MouseEvent): void => {
    try {
        const affectedElementsSummary = getAffectedElementsSummary(event);
        const domSummary = getElementsSummary([document.body]);

        if (affectedElementsSummary) {
            transportClient.send({
                event: MessagingTransportEvents.RECORDING_EVENT,
                payload: {
                    type: RecordingEventTypes.CLICK,
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
        document.removeEventListener('click', clickHandlerFunc);

        clickHandlerFunc = (event) => clickHandler(event);

        document.addEventListener('click', clickHandlerFunc);
    }
);
