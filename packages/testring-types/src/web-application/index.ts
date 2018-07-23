import { IBrowserProxyCommand } from '../browser-proxy/structs';

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

export interface IWebApplicationExecuteMessage {
    uid: string;
    applicant: string;
    command: IBrowserProxyCommand;
}

export interface IWebApplicationResponseMessage {
    uid: string;
    response: any;
    error: Error | null;
}
