import * as childProcess from 'child_process';
import process from 'node:process';

export function spawn(
    command: string,
    args: Array<string> = [],
): childProcess.ChildProcess {
    return childProcess.spawn(command, args, {
        stdio: [null, null, null, 'ipc'],
        cwd: process.cwd(),
        detached: true, // Keep detached: true for normal operation
    });
}

export function spawnDebug(
    command: string,
    args: Array<string> = [],
): childProcess.ChildProcess {
    return childProcess.spawn(command, args, {
        stdio: [null, null, null, 'ipc'],
        cwd: process.cwd(),
        detached: false, // Not detached in debug mode to prevent orphaned processes
    });
}
