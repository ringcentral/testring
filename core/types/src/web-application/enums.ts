export const enum WebApplicationMessageType {
    execute = 'WebApplication/execute',
    response = 'WebApplication/response',
}

export const enum WebApplicationDevtoolActions {
    register = 'WebApplication/register',
    registerComplete = 'WebApplication/registerComplete',
    unregister = 'WebApplication/unregister',
    unregisterComplete = 'WebApplication/unregisterComplete',
}

export const enum WebApplicationControllerEventType {
    execute = 'execute',
    response = 'response',
    afterResponse = 'afterResponse',
    error = 'error',
}
