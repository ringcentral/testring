import {IConfig} from '../config';

export interface ICLICommand {
    execute(): Promise<void>;

    shutdown(): Promise<void>;
}

export type CLICommandRunner = (
    config: IConfig,
    stdout: NodeJS.WritableStream,
) => ICLICommand;
