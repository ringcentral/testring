/// <reference types="chrome" />

import { IExtensionConfig, MessagingTransportEvents, RecorderEvents, RecordingEventTypes } from '@testring/types';

import { MessagingTransportClient } from './extension/messaging-transport';
import { getAffectedElementsSummary, getElementsSummary } from './extension/elements-summary';

type RecorderEvent = Event & { isRecorderEvent: boolean };

let activeBrowserEvent: RecorderEvent | null = null;
let activeBrowserEventTarget: EventTarget | null = null;

const transportClient = new MessagingTransportClient();

const eventHandler = (e: Event | RecorderEvent, type: RecordingEventTypes): void => {
    if ('isRecorderEvent' in e) {
        return;
    }

    try {
        const affectedElementsSummary = getAffectedElementsSummary(e);
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

    const EventConstructor: any = e.constructor;
    activeBrowserEvent = new EventConstructor(e.type, { ...e, bubbles: true });

    if (activeBrowserEvent) {
        activeBrowserEvent.isRecorderEvent = true;
    }

    activeBrowserEventTarget = e.target;
    e.stopImmediatePropagation();
    e.preventDefault();
};

transportClient.on(
    RecorderEvents.HANDSHAKE,
    (config: IExtensionConfig) => {
        document.addEventListener('click', (event) => eventHandler(event, RecordingEventTypes.CLICK), true);

        Array.from(document.querySelectorAll('input')).forEach((input) => {
            input.addEventListener('change', (event) => eventHandler(event, RecordingEventTypes.CHANGE));
        });
    }
);

transportClient.on(
    RecorderEvents.SPECIFY_PATH,
    (eventInfo) => {
        const specifiedPath = prompt('Please specify path', eventInfo.path);

        if (specifiedPath === null) {
            return;
        }

        transportClient.send({
            event: MessagingTransportEvents.RECORDING_EVENT,
            payload: {
                ...eventInfo,
                path: specifiedPath,
            },
        });
    }
);

transportClient.on(RecorderEvents.EMIT_BROWSER_EVENT, () => {
    if (activeBrowserEvent !== null && activeBrowserEventTarget !== null) {
        activeBrowserEventTarget.dispatchEvent(activeBrowserEvent);

        activeBrowserEventTarget = null;
        activeBrowserEvent = null;
    }
});

let contextMenuEvent;
window.oncontextmenu = (e) => contextMenuEvent = e;
transportClient.on(
    MessagingTransportEvents.RECORDING_EVENT,
    () => eventHandler(contextMenuEvent, RecordingEventTypes.EQUAL_TEXT),
);
