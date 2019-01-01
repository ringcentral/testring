import * as childProcess from 'child_process';
import * as process from 'process';

export function spawn(command: string, args: Array<string> = []): childProcess.ChildProcess {
    return childProcess.spawn(command, args, {
        stdio: [null, null, null, 'ipc'],
        cwd: process.cwd(),
        detached: true,
    });
}
