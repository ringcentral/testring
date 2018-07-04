export const enum WebApplicationMessageType {
    execute = 'WebApplication/execute',
    response = 'WebApplication/response'
}

export const enum WebApplicationControllerEventType {
    execute = 'execute',
    response = 'response',
    afterResponse = 'afterResponse',
    error = 'error'
}
