import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';
import { DevtoolScopeType, IDevtoolStartScope } from '@testring/types';

import React from 'react';
import MonacoEditor from 'react-monaco-editor';

import style from './style.css';

type Monaco = typeof monacoEditor;
type IStandaloneCodeEditor = monacoEditor.editor.IStandaloneCodeEditor;

type EditorProps = {
    highlights: Array<IDevtoolStartScope>;
    source: string;
    onChange: (value) => void;
};

type EditorState = {
    language: string;
    editor: null | IStandaloneCodeEditor;
    monaco: null | Monaco;
};

type EditorDidMountHandler = (editor: IStandaloneCodeEditor, monaco: Monaco) => void;


const isEditor = (obj: IStandaloneCodeEditor | null): obj is IStandaloneCodeEditor => obj !== null;


export class Editor extends React.Component<EditorProps, EditorState> {
    state = {
        language: 'javascript',
        editor: null,
        monaco: null,
    };

    componentDidMount(): void {
        window.addEventListener('resize', this.resizeHandler);
    }

    componentWillReceiveProps(nextProps: Readonly<EditorProps>, nextContext: any): void {
        if (nextProps.highlights !== this.props.highlights) {
            this.renderHighlights(nextProps.highlights);
        }
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
        }, () => this.renderHighlights(this.props.highlights));
    }


    private onChange() {
        const { editor } = this.state;

        if (isEditor(editor)) {
            this.props.onChange(editor.getValue());
        }
    }

    private resize() {
        const { editor } = this.state;

        if (isEditor(editor)) {
            editor.layout();
        }
    }

    private previousDecorations: string[] = [];

    getInlineHighlightClass(i: number) {
        return style[`highlightTextInline${i % 2}`];
    }

    getColumnHighlightClass(i: number) {
        return style[`highlightColumn${i % 2}`];
    }

    renderHighlights(highlights: Array<IDevtoolStartScope>) {
        const editor = this.state.editor;
        const monaco = this.state.monaco;

        if (editor !== null && monaco !== null) {
            let decorations: any[] = [];

            for (let i = 0, len = highlights.length; i < len; i++) {
                const highlight = highlights[i];
                const c = highlight.coordinates;
                let options: any;

                if (highlight.meta.type === DevtoolScopeType.inline) {
                    options = {
                        inlineClassName: this.getInlineHighlightClass(i),
                    };
                } else {
                    options = {
                        isWholeLine: true,
                        linesDecorationsClassName: this.getColumnHighlightClass(i),
                    };
                }

                decorations.push({
                    range: new (monaco as any).Range(c.start.line, c.start.col + 1, c.end.line, c.end.col + 1),
                    options,
                });
            }

            this.previousDecorations = (editor as IStandaloneCodeEditor)
                .deltaDecorations(this.previousDecorations, decorations.reverse());
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

