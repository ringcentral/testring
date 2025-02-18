import {IBrowserProxyPlugin} from '../browser-proxy';
import {IBrowserProxyCommand} from '../browser-proxy/structs';
import {IDevtoolRuntimeConfiguration} from '../devtool-backend';

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

export type IWebApplicationClient = {
    [K in keyof IBrowserProxyPlugin]: (...args: Array<any>) => Promise<any>;
};

export interface IWebApplicationConfig {
    screenshotsEnabled: boolean;
    screenshotPath: string;
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

export type SavePdfOptions = {
    filepath: string;
    orientation: string;
    scale: number;
    background: boolean;
    width: number;
    height: number;
    top: number;
    bottom: number;
    left: number;
    right: number;
    shrinkToFit: boolean;
    pageRanges: Array<any>;
};
