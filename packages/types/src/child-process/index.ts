import { ChildProcess } from 'child_process';

export interface IChildProcessForkOptions {
    debug: boolean;
    debugPortRange: number[];
}


export interface IChildProcess extends ChildProcess {
    debugPort: number | null;
}
