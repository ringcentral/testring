import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';

import React from 'react';
import MonacoEditor from 'react-monaco-editor';

import style from './style.css';

type Monaco = typeof monacoEditor;
type IStandaloneCodeEditor = monacoEditor.editor.IStandaloneCodeEditor;

type EditorState = {
    language: string;
    editor: null | IStandaloneCodeEditor;
    monaco: null | Monaco;
};

type EditorDidMountHandler = (editor: IStandaloneCodeEditor, monaco: Monaco) => void;


const isEditor = (obj: IStandaloneCodeEditor | null): obj is IStandaloneCodeEditor => obj !== null;


export class Editor extends React.Component<{ source: string }, EditorState> {
    state = {
        language: 'javascript',
        editor: null,
        monaco: null,
    };

    componentDidMount(): void {
        window.addEventListener('resize', this.resizeHandler);
    }

    componentWillUnmount(): void {
        window.removeEventListener('resize', this.resizeHandler);
    }

    private resizeHandler: () => void = () => this.resize();
    private editorDidMountHandler: EditorDidMountHandler = (editor, monaco) => this.editorDidMount(editor, monaco);


    private editorDidMount(editor: IStandaloneCodeEditor, monaco: Monaco) {
        editor.focus();

        this.setState({
            editor,
            monaco,
        });
    }


    private onChange() {
        const { editor } = this.state;

        if (isEditor(editor)) {
            // eslint-disable-next-line no-console
            console.log(editor.getPosition(), editor.getSelections());
        }
    }

    private resize() {
        const { editor } = this.state;

        if (isEditor(editor)) {
            editor.layout();
        }
    }

    render() {
        const { source } = this.props;
        const { language } = this.state;

        const options = {
            selectOnLineNumbers: true,
        };

        return (
            <div
                className={style.editorWrapper}
                onClick={this.onChange.bind(this)}
                onKeyUp={this.onChange.bind(this)}>
                <MonacoEditor
                    theme="vs"
                    language={language}
                    value={source}
                    options={options}
                    editorDidMount={this.editorDidMountHandler}
                />
            </div>
        );
    }
}

