import style from './style.css';
import * as React from 'react';

interface ButtonProps {
    onClick: (event: React.SyntheticEvent) => void;
    children: React.ReactNode;
}

export class Button extends React.PureComponent<ButtonProps> {
    render() {
        return (
            <button
                className={style.button}
                onClick={this.props.onClick}>
                {this.props.children}
            </button>
        );
    }
}
