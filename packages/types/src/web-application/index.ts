import { IBrowserProxyPlugin } from '../browser-proxy';
import { IBrowserProxyCommand } from '../browser-proxy/structs';
import { IDevtoolRuntimeConfiguration } from '../devtool-backend';
import { DependencyDict } from '../dependencies-builder';

export interface IWebApplicationRegisterMessage {
    id: string;
}

export interface IWebApplicationRegisterCompleteMessage {
    id: string;
    error: null | Error;
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

export interface IWebApplicationDependencyUpdateMessage {
    entryPath: string;
    dependencies: DependencyDict;
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

export interface IWebApplicationConfig {
    screenshotsEnabled: boolean;
    devtool: null | IDevtoolRuntimeConfiguration;
}

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

export type WebApplicationDevtoolCallback = (err: null | Error) => void;

