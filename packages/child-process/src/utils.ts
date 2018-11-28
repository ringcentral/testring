import { argv as processArgv } from 'process';

function checkArguments(argv: string[]) {
    return argv.findIndex(item => item.startsWith('--testring-parent-pid=')) > -1;
}

const IS_PARENT_ARGV_PASSED = checkArguments(processArgv);

export function isChildProcess(argv: string[] = processArgv): boolean {
    return argv ? checkArguments(argv) : IS_PARENT_ARGV_PASSED;
}
