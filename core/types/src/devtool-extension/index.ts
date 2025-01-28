import {ExtensionMessagingTransportTypes} from './enums';

export type ElementSummary = {
    tagName: string;
    attributes: {[name: string]: string};
    innerText?: string;
    value?: string;
    children?: ElementSummary[];
};

export interface IExtensionNetworkConfig {
    httpPort: number;
    wsPort: number;
    host: string;
}

export interface IExtensionApplicationConfig extends IExtensionNetworkConfig {
    appId: string;
}

export interface IExtensionMessagingTransportMessage {
    type: ExtensionMessagingTransportTypes;
    payload: any;
}
