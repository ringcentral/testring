export type ElementPath = Array<IElementPathNode>;

export const enum RecorderEvents {
    HANDSHAKE = 'RecorderEvents/HANDSHAKE',
    RECORDING = 'RecorderEvents/RECORDING',
}

export const enum RecordingEventTypes {
    CLICK = 'RecordingEventTypes/CLICK',
    CHANGE = 'RecordingEventTypes/CHANGE',
}

export const commandsByRecordingEventTypes = {
    [RecordingEventTypes.CLICK]: (manager, path) => `${manager}.click(${path});`,
    [RecordingEventTypes.CHANGE]: (manager, path, value) => `${manager}.setValue(${path}, ${value});`,
};

export interface IRecordingEvent {
    type: RecordingEventTypes;
    elementPath: ElementPath;
}

export interface IElementPathNode {
    id: string;
}
