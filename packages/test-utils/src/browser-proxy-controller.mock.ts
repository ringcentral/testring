import { IBrowserProxyController, IBrowserProxyCommand } from '@testring/types';

export class BrowserProxyControllerMock implements IBrowserProxyController {
    private callStack: Array<IBrowserProxyCommand> = [];

    spawn() {
        return Promise.resolve();
    }

    execute(applicant: string, command: IBrowserProxyCommand) {
        this.callStack.push(command);

        return Promise.resolve(1);
    }

    kill() {
        return Promise.resolve();
    }

    $getCommands() {
        return this.callStack;
    }
}
