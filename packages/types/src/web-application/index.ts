import { IBrowserProxyPlugin } from '../browser-proxy';
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

export type IWebApplicationClient = {
    [K in keyof IBrowserProxyPlugin]: (...args: Array<any>) => Promise<any>
};

export type WindowFeatureBoolean = 'yes' | 'no';

export type WindowFeaturesConfig = string | IWindowFeatures;

export interface IWindowFeatures {
    top?: number;
    left?: number;
    width?: number;
    height?: number;
    status?: WindowFeatureBoolean;
    toolbar?: WindowFeatureBoolean;
    menubar?: WindowFeatureBoolean;
    location?: WindowFeatureBoolean;
    resizable?: WindowFeatureBoolean;
    scrollbars?: WindowFeatureBoolean;
}

