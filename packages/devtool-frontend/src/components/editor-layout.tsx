import {
    ClientWsTransportEvents,
    DependencyDict,
    DevtoolEvents,
    IClientWsTransport,
    IDevtoolStartScope,
    IDevtoolWSMessage,
} from '@testring/types';

import React from 'react';
import { throttle } from '@testring/utils';

import { Editor } from './editor';

type EditorWsProviderProps = {
    wsClient: IClientWsTransport;
}

type EditorWsProvideState = {
    highlights: Array<IDevtoolStartScope>;
    filename: null | string;
    source: null | string;
    dependencies: null | DependencyDict;
};


type DependencyUpdateMessage = {
    highlights: Array<IDevtoolStartScope>;
    dependencies: DependencyDict;
    entryPath: string;
};

export class EditorLayout extends React.Component<EditorWsProviderProps, EditorWsProvideState> {
    state = {
        highlights: [],
        filename: null,
        source: null,
        dependencies: null,
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
            } else if (data.type === DevtoolEvents.STORE_STATE_DIFF && data.payload.dependencies) {
                this.handleStoreUpdate(data.payload.dependencies);
            }
        };

        wsClient.on(ClientWsTransportEvents.MESSAGE, this.wsMessageHandler);
        wsClient.send(DevtoolEvents.GET_STORE, {});
    }

    private wsMessageHandler?: (data: IDevtoolWSMessage) => void;

    private changeHandler: (value: string) => void = throttle((value) => this.sendChangeAction(value), 100);

    private previousChangedValue: string = '';

    sendChangeAction(source: string) {
        const filename = this.state.filename;
        const mask = `${filename}\n${source}`;

        if (this.previousChangedValue !== mask) {
            this.props.wsClient.send(DevtoolEvents.WRITE_FILE, {
                filename,
                source,
            });
            this.previousChangedValue = mask;
        }
    }

    handleStoreUpdate(dependenciesMessage: DependencyUpdateMessage) {
        let source = '';
        const filename = dependenciesMessage.entryPath;

        if (dependenciesMessage.dependencies[filename].source) {
            source = dependenciesMessage.dependencies[filename].source;
        }

        let highlights: Array<IDevtoolStartScope> = this.state.highlights;

        if (dependenciesMessage.highlights) {
            highlights = dependenciesMessage.highlights.filter((highlight) => {
                return highlight.filename === filename;
            });
        }

        this.setState({
            ...this.state,
            dependencies: dependenciesMessage.dependencies,
            highlights,
            filename,
            source,
        });
    }

    render() {
        if (this.state.source === null) {
            return (<p style={{ 'margin': '20px' }}>Waiting for store initialization...</p>);
        } else {
            const source = (this.state as any).source;

            return (<Editor highlights={this.state.highlights} source={source} onChange={this.changeHandler} />);
        }
    }
}
