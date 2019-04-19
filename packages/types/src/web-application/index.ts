import { IBrowserProxyPlugin } from '../browser-proxy';
import { IBrowserProxyCommand } from '../browser-proxy/structs';
import { IRecorderRuntimeConfiguration } from '../recorder-backend';

export const enum WebApplicationMessageType {
    execute = 'WebApplication/execute',
    response = 'WebApplication/response'
}

export const enum WebApplicationDevtoolMessageType {
    register = 'WebApplication/register',
    registerComplete = 'WebApplication/registerComplete',
    unregister = 'WebApplication/unregister',
    unregisterComplete = 'WebApplication/unregisterComplete',
}

export interface IWebApplicationRegisterMessage {
    id: string;
}

export interface IWebApplicationRegisterCompleteMessage {
    id: string;
    error: null | Error;
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

export interface IAssertionSuccessMeta {
    isSoft: boolean;
    successMessage?: string;
    assertMessage?: string;
}

export interface IAssertionErrorMeta extends IAssertionSuccessMeta {
    errorMessage?: string;
    error?: Error;
}

export interface IAssertionOptions {
    isSoft?: boolean;
    onSuccess?: (IAssertionSuccessMeta) => void | Promise<void>;
    onError?: (IAssertionErrorMeta) => void | Promise<void>;
}

export type IWebApplicationClient = {
    [K in keyof IBrowserProxyPlugin]: (...args: Array<any>) => Promise<any>
};

export type WindowFeatureBoolean = 'yes' | 'no';

export type WindowFeaturesConfig = string | IWindowFeatures;

export interface IWebApplicationConfig {
    screenshotsEnabled: boolean;
    devtool: null | IRecorderRuntimeConfiguration;
}

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

