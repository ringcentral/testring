import React from 'react';

import { Editor } from './components/editor';

const handler = (e) => console.log(e.target.getAttribute('data-test-automation-id'));

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

        <div data-test-automation-id="automationScope" onClick={handler}>
            <button data-test-automation-id="goodButtonInScope" id="goodButtonInScope" onClick={handler}>
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
        <div data-test-automation-id="numeric" onClick={handler}>
            <div data-test-automation-id="item1">123</div>
            <div data-test-automation-id="item2">456</div>
            <div data-test-automation-id="item3">789</div>
        </div>
        <button>
            Totally out of scope, not good
        </button>

        <Editor />
    </div>
);

