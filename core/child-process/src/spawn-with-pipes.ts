import * as childProcess from 'child_process';
import process from 'node:process';

export function spawnWithPipes(
    command: string,
    args: Array<string> = [],
): childProcess.ChildProcess {
    const child = childProcess.spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'], // Use pipes for proper control
        cwd: process.cwd(),
        detached: false, // Run attached to prevent orphan processes
    });

    // Ensure child does not keep the event loop active
    child.unref();

    return child;
}
