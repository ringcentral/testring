/// <reference types="chrome" />

import {
    BrowserEventInfo,
    IExtensionConfig,
    MessagingTransportEvents,
    RecorderEvents,
    RecordingEventTypes,
} from '@testring/types';

import { MessagingTransportClient } from './extension/messaging-transport';
import { getAffectedElementsSummary, getElementsSummary } from './extension/elements-summary';
import { generateUniqId } from '@testring/utils';

type RecorderEvent = Event & { isRecorderEvent: boolean };
type BrowserEventMap = {
    [id: string]: {
        browserEvent: RecorderEvent;
        browserEventTarget: EventTarget;
    };
};

const browserEventMap: BrowserEventMap = { };
const transportClient = new MessagingTransportClient();

const eventHandler = (e: Event | RecorderEvent, type: RecordingEventTypes): void => {
    if ('isRecorderEvent' in e || e.target === null) {
        return;
    }

    const id = generateUniqId();
    const EventConstructor: any = e.constructor;
    const browserEvent: RecorderEvent = new EventConstructor(e.type, { ...e, bubbles: true });
    browserEvent.isRecorderEvent = true;
    const browserEventTarget = e.target;
    browserEventMap[id] = {
        browserEvent,
        browserEventTarget,
    };
    e.stopImmediatePropagation();
    e.preventDefault();

    const affectedElementsSummary = getAffectedElementsSummary(e);
    const domSummary = getElementsSummary([document.body]);
    transportClient.send({
        event: MessagingTransportEvents.RECORDING_EVENT,
        payload: {
            id,
            type,
            affectedElementsSummary,
            domSummary,
        },
    });
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

transportClient.on(RecorderEvents.EMIT_BROWSER_EVENT, ({ id }: BrowserEventInfo) => {
    const { browserEvent, browserEventTarget } = browserEventMap[id];
    browserEventTarget.dispatchEvent(browserEvent);

    delete browserEventMap[id];
});

let contextMenuEvent;
window.oncontextmenu = (e) => contextMenuEvent = e;
transportClient.on(
    MessagingTransportEvents.RECORDING_EVENT,
    () => eventHandler(contextMenuEvent, RecordingEventTypes.EQUAL_TEXT),
);
