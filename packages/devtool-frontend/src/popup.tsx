import * as React from 'react';
import { render } from 'react-dom';

import { ClientWsTransport } from '@testring/client-ws-transport';
import { RecorderEvents, TestWorkerAction } from '@testring/types';


async function init() {
    const config = (window as any).rcRecorderConfig;

    const wsClient = new ClientWsTransport(config.host, config.wsPort);
    wsClient.connect();
    await wsClient.handshake(config.appId);

    const runAction = (actionType) => wsClient.send(RecorderEvents.WORKER_ACTION, { actionType });

    const btnStyle = {
        'height': '40px',
        'margin': '30px 10px',
        'display': 'inline-block',
    };

    class ButtonsLayout extends React.Component {
        render() {
            return (
                <div style={{ 'textAlign': 'center' }}>
                    <button
                        style={btnStyle}
                        onClick={() => runAction(TestWorkerAction.pauseTestExecution)}>
                        Pause
                    </button>
                    <button
                        style={btnStyle}
                        onClick={() => runAction(TestWorkerAction.runTillNextExecution)}>
                        Pause on Next
                    </button>
                    <button
                        style={btnStyle}
                        onClick={() => runAction(TestWorkerAction.resumeTestExecution)}>
                        Resume
                    </button>
                    <button
                        style={btnStyle}
                        onClick={() => runAction(TestWorkerAction.releaseTest)}>
                        Release
                    </button>
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
