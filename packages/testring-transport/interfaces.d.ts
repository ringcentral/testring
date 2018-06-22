
export interface ISerializedStruct {
    $key: string,
    [key: string]: any
}

export interface IMessage<T = any> {
    type: string,
    payload: T
}

export interface IDirectMessage extends IMessage {
    uid: string,
}

export interface IBroadcastMessage extends IMessage {}

export type Callback<T = any> = (payload: T, source?: string) => void;
