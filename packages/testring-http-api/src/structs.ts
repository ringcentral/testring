export const enum HttpMessageType {
    send = 'sendHttpRequest',
    response = 'responseHttpRequest',
    reject = 'rejectHttpRequest'
}

export const enum HttpServerPlugins {
    beforeRequest = 'beforeRequest',
    beforeResponse = 'beforeResponse'
}
