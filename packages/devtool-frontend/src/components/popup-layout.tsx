import {
    ITestControllerExecutionState,
    TestWorkerAction,
} from '@testring/types';

import React from 'react';

interface ButtonLayoutProps {
    workerState: ITestControllerExecutionState;
    executeAction: (action: TestWorkerAction) => Promise<void>;
}

const BTN_STYLES = {
    width: '50px',
    height: '50px',
    border: '0px',
    'textIndent': '200%',
    'whitSpace': 'no-wrap',
    backgroundColor: 'transparent',
    backgroundPosition: 'center',
    backgroundSize: '48px 48px',
    backgroundRepeat: 'no-repeat',
    overflow: 'hidden',
    margin: '25px 10px',
    display: 'inline-block',
    padding: 0,
};

export class ButtonsLayout extends React.Component <ButtonLayoutProps> {
    getBtnStyle(base64: string, active: boolean = true) {
        return {
            ...BTN_STYLES,
            backgroundImage: `url(${base64})`,
            cursor: active ? 'pointer' : 'default',
            opacity: active ? 1 : 0.6,
        };
    }

    renderPlayButton() {
        const { executeAction, workerState } = this.props;

        return (
            <button
                style={this.getBtnStyle(
                    require('../imgs/play.png'),
                    workerState.pending,
                )}
                onClick={() => executeAction(TestWorkerAction.resumeTestExecution)}>
                Play
            </button>
        );
    }

    renderPauseButton() {
        const { executeAction, workerState } = this.props;

        return (
            <button
                style={this.getBtnStyle(
                    require('../imgs/pause.png'),
                    workerState.pending,
                )}
                onClick={() => executeAction(TestWorkerAction.pauseTestExecution)}>
                Pause
            </button>
        );
    }

    renderPauseTillNextButton() {
        const { executeAction, workerState } = this.props;

        return (
            <button
                style={this.getBtnStyle(require('../imgs/next.png'), workerState.pending)}
                onClick={() => executeAction(TestWorkerAction.runTillNextExecution)}>
                Next
            </button>
        );
    }

    renderNextButton() {
        const { executeAction } = this.props;

        return (
            <button
                style={this.getBtnStyle(require('../imgs/forward.png'))}
                onClick={() => executeAction(TestWorkerAction.releaseTest)}>
                Forward
            </button>
        );
    }

    renderButtons() {
        const { workerState } = this.props;

        const isPaused = workerState.paused || workerState.pausedTilNext;

        return (
            <div style={{ 'textAlign': 'center', 'verticalAlign': 'top' }}>
                {isPaused ? this.renderPlayButton() : this.renderPauseButton()}
                {this.renderPauseTillNextButton()}
                {this.renderNextButton()}
            </div>
        );
    }

    render() {
        return this.renderButtons();
    }
}
