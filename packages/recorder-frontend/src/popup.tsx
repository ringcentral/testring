import * as React from 'react';
import { render } from 'react-dom';

import { ClientWsTransport } from '@testring/client-ws-transport/dist';
import { RecorderEvents, TestWorkerAction } from '@testring/types';


async function init() {
    const config = (window as any).rcRecorderConfig;

    const wsClient = new ClientWsTransport(config.host, config.wsPort);
    wsClient.connect();
    await wsClient.handshake(config.appId);

    const runAction = (actionType) => wsClient.send(RecorderEvents.WORKER_ACTION, { actionType });

    class ButtonsLayout extends React.Component {
        render() {
            return (
                <div>
                    <button onClick={() => runAction(TestWorkerAction.pauseTestExecution)}>Pause</button>
                    <button onClick={() => runAction(TestWorkerAction.resumeTestExecution)}>Resume</button>
                    <button onClick={() => runAction(TestWorkerAction.runTillNextExecution)}>Pause on Next</button>
                    <button onClick={() => runAction(TestWorkerAction.releaseTest)}>Release</button>
                </div>
            );
        }
    }

    render(
        <ButtonsLayout />,
        document.getElementById('rcRecorderApp'),
    );
}

init();
