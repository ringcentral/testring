export enum HttpMessageType {
    send = 'sendHttpRequest',
    response = 'responseHttpRequest',
    reject = 'rejectHttpRequest'
}

export enum HttpServerPlugins {
    beforeRequest = 'beforeRequest',
    beforeResponse = 'beforeResponse'
}
