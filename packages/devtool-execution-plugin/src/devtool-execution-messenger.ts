import { transport } from '@testring/transport';
import { TestWorkerAction, IDevtoolStartScope, IDevtoolEndScope } from '@testring/types';


export function startScope(
    filename: string,
    id: string,
    coordinates: [number, number, number, number],
    meta: any
) {
    transport.broadcastUniversally<IDevtoolStartScope>(TestWorkerAction.startScope, {
        filename,
        id,
        coordinates: {
            start: {
                line: coordinates[0],
                col: coordinates[1],
            },
            end: {
                line: coordinates[2],
                col: coordinates[3],
            },
        },
        meta,
    });
}

export function endScope(filename: string, ids: string[]) {
    for (let id of ids) {
        transport.broadcastUniversally<IDevtoolEndScope>(TestWorkerAction.endScope, {
            filename,
            id,
        });
    }
}
