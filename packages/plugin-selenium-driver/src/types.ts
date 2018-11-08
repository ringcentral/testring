import { Config } from 'webdriverio';

export type SeleniumPluginConfig = Config & {
    clientCheckInterval: number;
    clientTimeout: number;
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
