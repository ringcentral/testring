# @testring/devtool-frontend

React-based frontend debugging panel for the testring framework that provides a graphical user interface for test monitoring and control. This package works in conjunction with `@testring/devtool-backend` and `@testring/devtool-extension` to enable real-time log viewing, test execution control, and browser screenshot visualization.

[![npm version](https://badge.fury.io/js/@testring/devtool-frontend.svg)](https://www.npmjs.com/package/@testring/devtool-frontend)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Overview

The devtool frontend is a React-based UI component of the testring framework, providing:

- **Real-time test execution monitoring** with status updates and control
- **Interactive test control panel** for pausing, resuming, and stepping through tests
- **Monaco-based code editor** for viewing and editing test scripts
- **WebSocket communication** with the devtool backend
- **Browser extension integration** for capturing page elements and screenshots
- **Popup interface** for quick test control access

## Key Features

### 🖥️ Test Monitoring Interface
- Real-time test execution status display
- Console log viewing and filtering
- Test process control (pause, resume, step)
- Visual representation of test flow

### 📝 Code Editor
- Monaco-based code editor (same as VS Code)
- Syntax highlighting for JavaScript/TypeScript
- Code navigation and search capabilities
- Real-time code editing and preview

### 🔄 WebSocket Integration
- Real-time bidirectional communication with backend
- State synchronization across components
- Event-driven architecture for responsive UI
- Automatic reconnection handling

### 🧩 Component Architecture
- React component-based UI design
- Redux state management for predictable state
- Modular design for extensibility
- Responsive layout for different screen sizes

## Installation

```bash
# Using npm
npm install --save-dev @testring/devtool-frontend

# Using yarn
yarn add @testring/devtool-frontend --dev

# Using pnpm
pnpm add @testring/devtool-frontend --dev
```

## UI Components

### Main Editor Interface

The editor interface provides a full-featured code editor for test scripts:

```typescript
import React from 'react';
import MonacoEditor from 'react-monaco-editor';

export class Editor extends React.Component {
  state = {
    code: '// type your code...',
    editor: {} as any,
  };

  editorDidMount(editor, monaco) {
    editor.focus();
    this.setState({ editor, monaco });
  }

  render() {
    const { code } = this.state;
    const options = { selectOnLineNumbers: true };

    return (
      <div className="editor-wrapper">
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
```

### Popup Control Panel

The popup interface provides quick test control buttons:

```typescript
import React from 'react';
import { TestWorkerAction } from '@testring/types';

export class ButtonsLayout extends React.Component {
  render() {
    const { workerState, executeAction } = this.props;
    const isPaused = workerState.paused || workerState.pausedTilNext;

    return (
      <div className="buttons-container">
        {isPaused ? (
          <button onClick={() => executeAction(TestWorkerAction.resumeTestExecution)}>
            Play
          </button>
        ) : (
          <button onClick={() => executeAction(TestWorkerAction.pauseTestExecution)}>
            Pause
          </button>
        )}
        <button onClick={() => executeAction(TestWorkerAction.runTillNextExecution)}>
          Next
        </button>
        <button onClick={() => executeAction(TestWorkerAction.releaseTest)}>
          Forward
        </button>
      </div>
    );
  }
}
```

## WebSocket Integration

The frontend communicates with the backend using WebSocket:

```typescript
import { ClientWsTransport, ClientWsTransportEvents } from '@testring/client-ws-transport';
import { DevtoolEvents } from '@testring/types';

// Create WebSocket client
const wsClient = new ClientWsTransport('localhost', 9001);
wsClient.connect();

// Handshake with server
await wsClient.handshake('my-app-id');

// Listen for messages
wsClient.on(ClientWsTransportEvents.MESSAGE, (message) => {
  if (message.type === DevtoolEvents.STORE_STATE) {
    // Update UI with new state
    updateUIState(message.payload);
  }
});

// Send commands to server
function pauseTest() {
  wsClient.send(DevtoolEvents.WORKER_ACTION, {
    actionType: TestWorkerAction.pauseTestExecution
  });
}
```

## Usage

### Basic Setup

1. **Install the required packages**:
```bash
npm install --save-dev @testring/devtool-frontend @testring/devtool-backend
```

2. **Build the frontend**:
```bash
cd node_modules/@testring/devtool-frontend
npm run build
```

3. **Start the devtool server**:
```typescript
import { DevtoolServerController } from '@testring/devtool-backend';
import { transport } from '@testring/transport';

const devtoolServer = new DevtoolServerController(transport);
await devtoolServer.init();

const config = devtoolServer.getRuntimeConfiguration();
console.log(`Devtools UI available at: http://${config.host}:${config.httpPort}`);
```

### Integration with Test Framework

```typescript
import { DevtoolServerController } from '@testring/devtool-backend';
import { TestRunController } from '@testring/test-run-controller';
import { transport } from '@testring/transport';

// Start devtool server
const devtoolServer = new DevtoolServerController(transport);
await devtoolServer.init();
const config = devtoolServer.getRuntimeConfiguration();

// Configure test runner with devtools
const testRunner = new TestRunController(transport);
await testRunner.runTests({
  tests: ['./tests/**/*.spec.ts'],
  config: {
    devtool: {
      enabled: true,
      httpPort: config.httpPort,
      wsPort: config.wsPort
    }
  }
});
```

## Development

### Project Structure

```
src/
├── components/           # React UI components
│   ├── editor/           # Code editor components
│   ├── popup-layout.tsx  # Popup control interface
│   └── EditorLayout.tsx  # Main editor layout
├── containers/           # State containers
│   └── popup-ws-provider.tsx  # WebSocket state provider
├── imgs/                 # UI images and icons
├── editor.tsx            # Editor entry point
└── popup.tsx             # Popup entry point
```

### Building the Frontend

```bash
# Development build with watch mode
npm run build:watch

# Production build
npm run build
```

### Output Structure

```
dist/
├── editor.bundle.js      # Main editor interface
├── popup.bundle.js       # Popup control interface
└── [monaco editor files] # Editor dependencies
```

## API Reference

### Exported Module

```typescript
// Main export from index.js
module.exports = {
  absolutePath: string  // Absolute path to the built frontend assets
};
```

### Component Props

#### PopupWsProvider

```typescript
interface IPopupWsProviderProps {
  wsClient: IClientWsTransport;  // WebSocket client for communication
}

interface IPopupWsProviderState {
  initialized: boolean;  // Whether the provider is initialized
  workerState: ITestControllerExecutionState;  // Current test state
}
```

#### ButtonsLayout

```typescript
interface ButtonLayoutProps {
  workerState: ITestControllerExecutionState;  // Current test state
  executeAction: (action: TestWorkerAction) => Promise<void>;  // Action dispatcher
}
```

## Integration Examples

### With Chrome Extension

```typescript
import { absolutePath } from '@testring/devtool-frontend';
import { extensionId } from '@testring/devtool-extension';

// The extension will load the frontend from the backend server
console.log('Frontend assets path:', absolutePath);
console.log('Extension ID:', extensionId);
```

### With Custom Backend

```typescript
import express from 'express';
import { absolutePath } from '@testring/devtool-frontend';

const app = express();

// Serve the frontend assets
app.use('/devtools', express.static(absolutePath));

app.listen(8080, () => {
  console.log('Custom devtools server running at http://localhost:8080/devtools');
});
```

## Troubleshooting

### Common Issues

1. **WebSocket connection failures**:
   - Ensure the devtool-backend server is running
   - Check port configurations match between frontend and backend
   - Verify network connectivity and firewall settings

2. **UI not updating**:
   - Check WebSocket connection status
   - Verify Redux state updates are propagating
   - Check browser console for errors

3. **Editor not loading**:
   - Ensure Monaco editor files are properly built
   - Check for JavaScript errors in the console
   - Verify the DOM element with ID 'rcRecorderApp' exists

### Debug Mode

Enable debug logging in the frontend:

```typescript
// In your component
componentDidMount() {
  console.log('Component mounted with props:', this.props);
  console.log('Initial state:', this.state);

  // Log WebSocket events
  this.props.wsClient.on(ClientWsTransportEvents.MESSAGE, (msg) => {
    console.log('WebSocket message:', msg);
  });
}
```

## Dependencies

- **`react`** - UI component library
- **`react-dom`** - React DOM rendering
- **`react-monaco-editor`** - Monaco code editor for React
- **`@testring/client-ws-transport`** - WebSocket communication
- **`@testring/types`** - TypeScript type definitions
- **`monaco-editor-webpack-plugin`** - Monaco editor integration
- **`webpack`** - Module bundling and build system

## Related Modules

- **`@testring/devtool-backend`** - Backend server for developer tools
- **`@testring/devtool-extension`** - Chrome extension for browser integration
- **`@testring/test-run-controller`** - Test execution controller
- **`@testring/transport`** - Inter-process communication

## License

MIT License - see the [LICENSE](https://github.com/ringcentral/testring/blob/master/LICENSE) file for details.
