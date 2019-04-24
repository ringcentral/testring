import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import style from './style.css';

export class Editor extends React.Component {
    state = {
        code: '// type your code...',
        editor: {} as any,
    };

    editorDidMount(editor, monaco) {
        editor.focus();
        this.setState({
            editor,
            monaco,
        });
    }
    onChange() {
        // eslint-disable-next-line no-console
        console.log(this.state.editor.getPosition(), this.state.editor.getSelections());
    }
    render() {
        const { code } = this.state;

        const options = {
            selectOnLineNumbers: true,
        };

        return (
            <div
                className={style.editorWrapper}
                onClick={this.onChange.bind(this)}
                onKeyUp={this.onChange.bind(this)}>
                <MonacoEditor
                    language="javascript"
                    theme="vs-dark"
                    value={code}
                    options={options}
                    editorDidMount={this.editorDidMount.bind(this)}
                />
            </div>
        );
    }
}

