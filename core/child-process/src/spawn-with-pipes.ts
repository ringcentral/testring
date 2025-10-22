import * as childProcess from 'child_process';
import process from 'node:process';

export function spawnWithPipes(
    command: string,
    args: Array<string> = [],
): childProcess.ChildProcess {
    // Note: child.unref() removed to prevent orphaned processes
    // Node.js will now wait for child process to exit before main process exits

    return childProcess.spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'], // Use pipes for proper control
        cwd: process.cwd(),
        detached: false, // Run attached to prevent orphan processes
        windowsHide: true, // Hide the console window on Windows
    });
}
