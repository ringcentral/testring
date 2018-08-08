import { IBrowserProxyController, IBrowserProxyCommand } from '@testring/types';

export class BrowserProxyControllerMock implements IBrowserProxyController {
    private callStack: Array<IBrowserProxyCommand> = [];

    spawn() {
        return Promise.resolve(0);
    }

    execute(applicant: string, command: IBrowserProxyCommand) {
        this.callStack.push(command);

        return Promise.resolve();
    }

    kill() {
        return Promise.resolve();
    }

    $getCommands() {
        return this.callStack;
    }
}
