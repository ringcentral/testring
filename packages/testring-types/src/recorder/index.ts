export const TEST_ELEMENT_IDENTIFIER = 'data-test-automation-id';

export type ElementPath = Array<IElementPathNode>;

export const enum RecorderEvents {
    HANDSHAKE = 'RecorderEvents/HANDSHAKE',
    RECORDING = 'RecorderEvents/RECORDING',
}

export const enum RecordingEventTypes {
    CLICK = 'RecordingEventTypes/CLICK',
}

export interface IRecordingEvent {
    type: RecordingEventTypes;
    elementPath: ElementPath;
}

export interface IElementPathNode {
    id: string;
}
