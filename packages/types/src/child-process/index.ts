import { ChildProcess } from 'child_process';

export interface IChildProcessForkOptions {
    debug: boolean;
    debugPortRange: number[];
}


export interface IChildProcessFork extends ChildProcess {
    debugPort: number | null;
}
