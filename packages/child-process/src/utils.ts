import { argv as processArgv } from 'process';

export function isChildProcess(argv: string[] = processArgv): boolean {
    return argv.findIndex(item => item.startsWith('--testring-parent-pid=')) > -1;
}
