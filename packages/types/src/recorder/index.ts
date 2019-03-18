export type ElementPath = Array<IElementPathNode>;

export const enum RecorderEvents {
    HANDSHAKE = 'RecorderEvents/HANDSHAKE',
    EMIT_BROWSER_EVENT = 'RecorderEvents/EMIT_BROWSER_EVENT',
    SPECIFY_PATH = 'RecorderEvents/SPECIFY_PATH',
    RECORDING = 'RecorderEvents/RECORDING',
}

export const enum RecordingEventTypes {
    CLICK = 'RecordingEventTypes/CLICK',
    CHANGE = 'RecordingEventTypes/CHANGE',
    EQUAL_TEXT = 'RecordingEventTypes/EQUAL_TEXT',
}

export const commandsByRecordingEventTypes = {
    [RecordingEventTypes.CLICK]: ({ manager, path }) => `await ${manager}.click(${path});`,
    [RecordingEventTypes.CHANGE]: ({ manager, path, value }) => `await ${manager}.setValue(${path}, '${value}');`,
    [RecordingEventTypes.EQUAL_TEXT]: ({ manager, path, text }) => `await ${manager}.assert.equal(await ${manager}.getText(${path}), '${text}');`,
};

export interface IRecordingEvent {
    type: RecordingEventTypes;
    elementPath: ElementPath;
}

export interface IElementPathNode {
    id: string;
}
