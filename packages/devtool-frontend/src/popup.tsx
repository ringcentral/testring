import {
    ClientWsTransportEvents,
    DevtoolEvents,
    ITestControllerExecutionState,
    TestWorkerAction,
} from '@testring/types';
import * as React from 'react';
import { render } from 'react-dom';

import { ClientWsTransport } from '@testring/client-ws-transport';


async function init() {
    const config = (window as any).rcRecorderConfig;

    const wsClient = new ClientWsTransport(config.host, config.wsPort);
    wsClient.connect();
    await wsClient.handshake(config.appId);

    const runAction = (actionType) => wsClient.send(DevtoolEvents.WORKER_ACTION, { actionType });

    const btnStyle = {
        width: '50px',
        height: '50px',
        border: '0px',
        'textIndent': '200%',
        'whitSpace': 'no-wrap',
        backgroundColor: 'transparent',
        backgroundPosition: 'center',
        overflow: 'hidden',
        margin: '25px 10px',
        display: 'inline-block',
        padding: 0,
    };

    const getButtonStyle = (base64: string, active: boolean = true) => {
        return {
            ...btnStyle,
            backgroundImage: `url(${base64})`,
            cursor: active ? 'pointer' : 'default',
            opacity: active ? 1 : 0.6,
        };
    };

    class ButtonsLayout extends React.Component <{workerState?: any}> {
        componentDidMount(): void {
            wsClient.on(ClientWsTransportEvents.MESSAGE, (data) => {
                if (data.type === DevtoolEvents.STORE_STATE) {
                    this.handleStoreUpdate(data.payload);
                }
            });
            wsClient.send(DevtoolEvents.GET_STORE, {});
        }

        handleStoreUpdate(storeData: any = {}) {
            const workerState = (storeData.workerState || {}) as any;

            this.setState( {
                ...this.state,
                workerState,
            });
        }

        renderButtons(workerState: ITestControllerExecutionState) {
            return (
                <div style={{ 'textAlign': 'center', 'verticalAlign': 'top' }}>
                    <button
                        disabled={workerState.paused}
                        style={getButtonStyle(require('./imgs/pause.png'), !workerState.paused)}
                        onClick={() => runAction(TestWorkerAction.pauseTestExecution)}>
                        Pause
                    </button>
                    <button
                        style={getButtonStyle(require('./imgs/next.png'))}
                        onClick={() => runAction(TestWorkerAction.runTillNextExecution)}>
                        Next
                    </button>
                    <button
                        disabled={!(workerState.paused || workerState.pausedTilNext)}
                        style={getButtonStyle(
                            require('./imgs/play.png'),
                            workerState.paused || workerState.pausedTilNext
                        )}
                        onClick={() => runAction(TestWorkerAction.resumeTestExecution)}>
                        Resume
                    </button>
                    <button
                        style={getButtonStyle(require('./imgs/stop.png'))}
                        onClick={() => runAction(TestWorkerAction.releaseTest)}>
                        Release
                    </button>
                </div>
            );
        }

        render() {
            const workerState = (this.state as any || {}).workerState;

            if (workerState) {
                return this.renderButtons(workerState);
            } else {
                return (
                    <div style={{ 'textAlign': 'center' }}>
                        Waiting for store initialization...
                    </div>
                );
            }
        }
    }

    render(
        <ButtonsLayout />,
        document.getElementById('rcRecorderApp'),
    );
}

init();
