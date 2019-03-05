export type ElementPath = Array<IElementPathNode>;

export const enum RecorderEvents {
    HANDSHAKE = 'RecorderEvents/HANDSHAKE',
    RECORDING = 'RecorderEvents/RECORDING',
}

export const enum RecordingEventTypes {
    CLICK = 'RecordingEventTypes/CLICK',
    CHANGE = 'RecordingEventTypes/CHANGE',
}

export const actionsByRecordingEventTypes = {
    [RecordingEventTypes.CLICK]: 'click',
    [RecordingEventTypes.CHANGE]: 'setValue',
};

export interface IRecordingEvent {
    type: RecordingEventTypes;
    elementPath: ElementPath;
}

export interface IElementPathNode {
    id: string;
}
