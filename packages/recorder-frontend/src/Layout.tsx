import React from 'react';

import { Editor } from './components/editor';

export const Layout = () => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    }} >
        <h1 style={{
            fontSize: 43,
            fontWeight: 500,
            fontStyle: 'italic'
        }} >
            TestRing
        </h1>

        <div data-test-automation-id="automationScope" >
            <button data-test-automation-id="goodButtonInScope" >
                Good button in scope
            </button>
            <button>
                Not so good button, yet in scope
            </button>
        </div>
        <div>
            <button data-test-automation-id="goodButtonOutOfScope" >
                Out of scope, but still good
            </button>
            <input type="text" name="input" data-test-automation-id="input" />
        </div>
        <button>
            Totally out of scope, not good
        </button>

        <Editor />
    </div>
);

