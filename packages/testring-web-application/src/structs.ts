export enum WebApplicationMessageType {
    execute = 'WebManager/execute',
    response = 'WebManager/response'
}

export enum WebApplicationControllerEventType {
    execute = 'execute',
    response = 'response',
    afterResponse = 'afterResponse',
    error = 'error'
}
