import { BrowserProxyActions } from './src/structs';

export interface IBrowserProxyCommand {
    action: BrowserProxyActions,
    args: Array<string>,
}

export interface IBrowserProxyMessage {
    uid: string,
    command: IBrowserProxyCommand,
}

export interface IBrowserProxyCommandResponse {
    uid: string,
    exception: Error|void,
}

export interface IBrowserProxyPendingCommand {
    resolve: () => void,
    reject: (exception: Error) => void,
    command: IBrowserProxyCommand,
}
