import { IBrowserProxyCommand } from '@testring/types';

export interface IExecuteMessage {
    uid: string;
    applicant: string;
    command: IBrowserProxyCommand;
}

export interface IResponseMessage {
    uid: string;
    response: any;
    error: Error | null;
}
