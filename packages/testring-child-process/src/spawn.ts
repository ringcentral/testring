import * as childProcess from 'child_process';
import * as process from 'process';
import { transport } from '@testring/transport';

export const spawn = (command: string, args: Array<string> = []): childProcess.ChildProcess => {
    return childProcess.spawn(command, args, {
        stdio: transport.getProcessStdioConfig(),
        cwd: process.cwd()
    });
};
