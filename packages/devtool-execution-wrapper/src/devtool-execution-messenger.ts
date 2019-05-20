import { transport } from '@testring/transport';
import { TestWorkerAction, IDevtoolStartScope, IDevtoolEndScope } from '@testring/types';


export function broadcastStartScope(
    filename: string,
    id: string,
    coordinates: IDevtoolStartScope['coordinates'],
    meta: any
) {
    transport.broadcastUniversally<IDevtoolStartScope>(TestWorkerAction.startScope, {
        filename,
        id,
        coordinates,
        meta,
    });
}

export function broadcastStopScope(filename: string, id: string) {
    transport.broadcastUniversally<IDevtoolEndScope>(TestWorkerAction.endScope, {
        filename,
        id,
    });
}
