import { IBrowserProxyCommand } from '@testring/browser-proxy';

interface IExecuteMessage {
    uid: string,
    applicant: string,
    command: IBrowserProxyCommand
}

interface IResponseMessage {
    uid: string,
    response?: any,
    error?: Error
}
