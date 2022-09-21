import React, { Component } from 'react';
import {
    ClientWsTransportEvents,
    DevtoolEvents,
    IClientWsTransport,
    IDevtoolWSMessage,
    ITestControllerExecutionState,
    TestWorkerAction,
} from '@testring/types';
import { ButtonsLayout } from '../components/popup-layout';

interface IPopupWsProviderProps {
    wsClient: IClientWsTransport;
}

interface IPopupWsProviderState {
    initialized: boolean;
    workerState: ITestControllerExecutionState;
}

export class PopupWsProvider extends Component<IPopupWsProviderProps, IPopupWsProviderState> {
    state = {
        initialized: false,
        workerState: {
            pausedTilNext: false,
            paused: false,
            pending: false,
        },
    };

    componentWillMount(): void {
        if (this.wsMessageHandler) {
            this.props.wsClient.removeListener(ClientWsTransportEvents.MESSAGE, this.wsMessageHandler);
            delete this.wsMessageHandler;
        }
    }

    componentDidMount(): void {
        const { wsClient } = this.props;

        this.wsMessageHandler = (data: IDevtoolWSMessage) => {
            if (data.type === DevtoolEvents.STORE_STATE) {
                this.handleStoreUpdate(data.payload.workerState);
            }
        };

        wsClient.on(ClientWsTransportEvents.MESSAGE, this.wsMessageHandler);
        wsClient.send(DevtoolEvents.GET_STORE, {});

        this.executeActionDispatcher = (actionType: TestWorkerAction) => {
            return this.props.wsClient.send(DevtoolEvents.WORKER_ACTION, { actionType });
        };
    }

    private wsMessageHandler?: (data: IDevtoolWSMessage) => void;
    private executeActionDispatcher: (action: TestWorkerAction) => Promise<void>;

    handleStoreUpdate(workerState: ITestControllerExecutionState) {
        this.setState({
            ...this.state,
            initialized: true,
            workerState: {
                ...workerState,
            },
        });
    }

    renderInitState() {
        return (
            <div style={{ 'textAlign': 'center' }}>
                Waiting for store initialization...
            </div>
        );
    }

    render() {
        if (this.state.initialized) {
            return (
                <ButtonsLayout
                    workerState={this.state.workerState}
                    executeAction={this.executeActionDispatcher}
                />
            );
        }

        return this.renderInitState();
    }
}
