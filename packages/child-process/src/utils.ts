import { argv } from 'process';

export function isChildProcess() {
    return argv.findIndex(item => item.startsWith('--testring-parent-pid=')) > -1;
}
