import {
    ClientWsTransportEvents,
    DevtoolEvents,
    IClientWsTransport,
    IDevtoolWSMessage,
} from '@testring/types';

import React from 'react';

import { Editor } from './editor';

interface IEditorWsProviderProps {
    wsClient: IClientWsTransport;
}

export class EditorLayout extends React.Component<IEditorWsProviderProps, { source: null | string }> {
    state = {
        source: null,
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
                this.handleStoreUpdate(data.payload.dependencies);
            } else if (data.type === DevtoolEvents.STORE_STATE_DIFF && data.payload.workerState) {
                this.handleStoreUpdate(data.payload.dependencies);
            }
        };

        wsClient.on(ClientWsTransportEvents.MESSAGE, this.wsMessageHandler);
        wsClient.send(DevtoolEvents.GET_STORE, {});
    }

    private wsMessageHandler?: (data: IDevtoolWSMessage) => void;

    handleStoreUpdate(dependencies: { data: { source: string } }) {
        this.setState({
            ...this.state,
            source: dependencies.data.source,
        });
    }

    render() {
        if (this.state.source === null) {
            return (<p>Waiting for store initialization...</p>);
        } else {
            const source = (this.state as any).source;
            return (<Editor source={source} />);
        }
    }
}
