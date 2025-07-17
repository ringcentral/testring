# @testring/client-ws-transport

WebSocket client transport module that serves as the core real-time communication component for the testring framework. This module provides comprehensive WebSocket connection management, message transmission, and error handling capabilities, implementing efficient real-time communication mechanisms, automatic reconnection, message queuing, and handshake protocol processing for stable and reliable infrastructure in testing environments.

[![npm version](https://badge.fury.io/js/@testring/client-ws-transport.svg)](https://www.npmjs.com/package/@testring/client-ws-transport)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)

## Overview

The WebSocket client transport module is the real-time communication core of the testring framework, providing:

- **Complete WebSocket lifecycle management** with connection establishment, maintenance, and cleanup
- **Intelligent auto-reconnection** and error recovery mechanisms
- **Efficient message queuing** and asynchronous processing capabilities
- **Comprehensive event system** and state management
- **Type-safe TypeScript interfaces** for reliable development
- **Standardized handshake protocol** and data formats
- **Flexible configuration** and extension capabilities
- **Concurrent-safe operations** for multi-threaded environments

## Key Features

### 🔗 Connection Management
- Automatic WebSocket connection establishment and maintenance
- Flexible connection parameter configuration and management
- Real-time connection status monitoring and reporting
- Graceful connection closure and resource cleanup

### 🛡️ Error Handling
- Comprehensive error capture and classification
- Intelligent reconnection strategies and retry mechanisms
- Configurable error recovery and fault tolerance
- Detailed error information and debugging support

### 📨 Message Processing
- Efficient message serialization and deserialization
- Smart message queuing and asynchronous sending
- Reliable message delivery and order guarantees
- Flexible message formats and protocol support

### 🎯 Event System
- Complete event-driven architecture and listening mechanisms
- Rich lifecycle events and status notifications
- Extensible event handling and callback systems
- Thread-safe event distribution and processing

## Installation

```bash
# Using npm
npm install @testring/client-ws-transport

# Using yarn
yarn add @testring/client-ws-transport

# Using pnpm
pnpm add @testring/client-ws-transport
```

## Core Architecture

### ClientWsTransport Class

The main WebSocket client transport interface, extending `EventEmitter`:

```typescript
class ClientWsTransport extends EventEmitter implements IClientWsTransport {
  constructor(
    host: string,
    port: number,
    shouldReconnect?: boolean
  )

  // Connection Management
  public connect(url?: string): void
  public disconnect(): void
  public reconnect(): void
  public getConnectionStatus(): boolean

  // Message Transport
  public send(type: DevtoolEvents, payload: any): Promise<void>
  public handshake(appId: string): Promise<void>

  // Event System (inherited from EventEmitter)
  public on(event: ClientWsTransportEvents, listener: Function): this
  public emit(event: ClientWsTransportEvents, ...args: any[]): boolean
}
```

### Event Types

```typescript
enum ClientWsTransportEvents {
  OPEN = 'open',        // Connection established
  MESSAGE = 'message',  // Message received
  CLOSE = 'close',      // Connection closed
  ERROR = 'error'       // Error event
}

enum DevtoolEvents {
  HANDSHAKE_REQUEST = 'handshake_request',       // Handshake request
  HANDSHAKE_RESPONSE = 'handshake_response',     // Handshake response
  MESSAGE = 'message',                           // General message
  REGISTER = 'register',                         // Registration event
  UNREGISTER = 'unregister'                      // Unregistration event
}
```

### Message Types

```typescript
interface IDevtoolWSMessage {
  type: DevtoolEvents;  // Message type
  payload: any;         // Message payload
}

interface IDevtoolWSHandshakeResponseMessage {
  type: DevtoolEvents.HANDSHAKE_RESPONSE;
  payload: {
    error?: string;     // Error message
    success?: boolean;  // Success indicator
  };
}

interface IQueuedMessage {
  type: DevtoolEvents;  // Message type
  payload: any;         // Message payload
  resolve: () => any;   // Promise resolve callback
}
```

## Basic Usage

### Creating and Connecting

```typescript
import { ClientWsTransport, ClientWsTransportEvents, DevtoolEvents } from '@testring/client-ws-transport';

// Create WebSocket client
const wsClient = new ClientWsTransport(
  'localhost',  // Server host
  3001,         // WebSocket port
  true          // Auto-reconnect enabled
);

// Listen to connection events
wsClient.on(ClientWsTransportEvents.OPEN, () => {
  console.log('WebSocket connection established');
});

wsClient.on(ClientWsTransportEvents.CLOSE, () => {
  console.log('WebSocket connection closed');
});

wsClient.on(ClientWsTransportEvents.ERROR, (error) => {
  console.error('WebSocket connection error:', error);
});

wsClient.on(ClientWsTransportEvents.MESSAGE, (message) => {
  console.log('Message received:', message);
});

// Establish connection
wsClient.connect();

// Check connection status
if (wsClient.getConnectionStatus()) {
  console.log('Connection established');
} else {
  console.log('Connection not established');
}
```

### Sending and Receiving Messages

```typescript
// Send message
async function sendMessage() {
  try {
    // Send general message
    await wsClient.send(DevtoolEvents.MESSAGE, {
      action: 'test.start',
      testId: 'test-001',
      timestamp: Date.now()
    });

    console.log('Message sent successfully');
  } catch (error) {
    console.error('Failed to send message:', error);
  }
}

// Send registration message
async function registerClient() {
  try {
    await wsClient.send(DevtoolEvents.REGISTER, {
      clientId: 'test-client-1',
      clientType: 'web-application',
      capabilities: ['screenshot', 'element-highlight', 'console-log']
    });

    console.log('Client registered successfully');
  } catch (error) {
    console.error('Client registration failed:', error);
  }
}

// Handle received messages
wsClient.on(ClientWsTransportEvents.MESSAGE, (message) => {
  const { type, payload } = message;

  switch (type) {
    case DevtoolEvents.MESSAGE:
      handleGeneralMessage(payload);
      break;

    case DevtoolEvents.REGISTER:
      handleRegistrationMessage(payload);
      break;

    case DevtoolEvents.UNREGISTER:
      handleUnregistrationMessage(payload);
      break;

    default:
      console.log('Unknown message type:', type, payload);
  }
});

function handleGeneralMessage(payload: any) {
  console.log('Handling general message:', payload);

  if (payload.action === 'test.status') {
    updateTestStatus(payload.testId, payload.status);
  } else if (payload.action === 'screenshot.request') {
    takeScreenshot(payload.options);
  }
}

function handleRegistrationMessage(payload: any) {
  console.log('Handling registration message:', payload);
  // Handle other client registration information
}

function handleUnregistrationMessage(payload: any) {
  console.log('Handling unregistration message:', payload);
  // Handle other client unregistration information
}

// Execute message sending
sendMessage();
registerClient();
```

### Handshake Protocol Handling

```typescript
// Perform handshake protocol
async function performHandshake() {
  try {
    // Wait for connection establishment
    await new Promise<void>((resolve) => {
      if (wsClient.getConnectionStatus()) {
        resolve();
      } else {
        wsClient.once(ClientWsTransportEvents.OPEN, resolve);
      }
    });

    console.log('Performing handshake protocol...');

    // Execute handshake
    await wsClient.handshake('test-app-001');

    console.log('Handshake protocol completed');

    // Post-handshake operations
    await initializeApplication();

  } catch (error) {
    console.error('Handshake protocol failed:', error);

    // Handshake failure handling logic
    handleHandshakeFailure(error);
  }
}

async function initializeApplication() {
  console.log('Initializing application...');

  // Register client
  await wsClient.send(DevtoolEvents.REGISTER, {
    appId: 'test-app-001',
    version: '1.0.0',
    timestamp: Date.now()
  });

  // Send initial status
  await wsClient.send(DevtoolEvents.MESSAGE, {
    action: 'app.ready',
    status: 'initialized'
  });
}

function handleHandshakeFailure(error: Error) {
  console.error('Handshake failed, attempting reconnection...', error.message);

  // Delayed retry
  setTimeout(() => {
    wsClient.reconnect();
    setTimeout(performHandshake, 1000);
  }, 3000);
}

// Execute handshake after connection establishment
wsClient.on(ClientWsTransportEvents.OPEN, () => {
  performHandshake();
});

// Start connection
wsClient.connect();
```

## Advanced Usage

### Custom Connection Manager

```typescript
class AdvancedWsClient {
  private wsClient: ClientWsTransport;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval?: NodeJS.Timeout;
  private isAuthenticated = false;

  constructor(host: string, port: number) {
    this.wsClient = new ClientWsTransport(host, port, false); // Disable auto-reconnect
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.wsClient.on(ClientWsTransportEvents.OPEN, () => {
      console.log('Connection established successfully');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.authenticate();
    });

    this.wsClient.on(ClientWsTransportEvents.CLOSE, () => {
      console.log('Connection closed');
      this.isAuthenticated = false;
      this.stopHeartbeat();
      this.attemptReconnect();
    });

    // Additional event handlers...
  }

  // Authentication
  private async authenticate() {
    try {
      await this.wsClient.handshake('advanced-client');

      // Send authentication information
      await this.wsClient.send(DevtoolEvents.MESSAGE, {
        action: 'auth.login',
        credentials: {
          token: process.env.AUTH_TOKEN || 'default-token',
          clientId: 'advanced-client',
          version: '2.0.0'
        }
      });
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  }

  // Heartbeat mechanism
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(async () => {
      if (this.wsClient.getConnectionStatus()) {
        await this.wsClient.send(DevtoolEvents.MESSAGE, {
          action: 'heartbeat',
          timestamp: Date.now()
        });
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  // Public API
  public connect() {
    this.wsClient.connect();
  }

  public disconnect() {
    this.stopHeartbeat();
    this.wsClient.disconnect();
  }

  public async sendMessage(action: string, data: any) {
    if (!this.isAuthenticated) {
      throw new Error('Client not authenticated');
    }

    return this.wsClient.send(DevtoolEvents.MESSAGE, {
      action,
      data,
      timestamp: Date.now()
    });
  }
}
```

### Message Queue Management

```typescript
class MessageQueueManager {
  private wsClient: ClientWsTransport;
  private messageQueue: Array<{ type: DevtoolEvents; payload: any; priority: number }> = [];
  private processingQueue = false;
  private batchSize = 10;
  private batchInterval = 1000;

  constructor(wsClient: ClientWsTransport) {
    this.wsClient = wsClient;
    this.startBatchProcessing();
  }

  // Add message to queue
  public enqueueMessage(type: DevtoolEvents, payload: any, priority = 1) {
    this.messageQueue.push({ type, payload, priority });

    // Sort by priority (higher priority first)
    this.messageQueue.sort((a, b) => b.priority - a.priority);
  }

  // Process messages in batches
  private async processBatch() {
    if (this.processingQueue || !this.wsClient.getConnectionStatus()) {
      return;
    }

    this.processingQueue = true;

    try {
      const batch = this.messageQueue.splice(0, this.batchSize);

      if (batch.length > 0) {
        // Concurrent message sending
        const promises = batch.map(({ type, payload }) =>
          this.wsClient.send(type, payload).catch(error => {
            // Re-queue failed messages with lower priority
            this.enqueueMessage(type, payload, 0);
          })
        );

        await Promise.all(promises);
      }
    } finally {
      this.processingQueue = false;
    }
  }
}
```

### Performance Monitoring

```typescript
class PerformanceMonitor {
  private wsClient: ClientWsTransport;
  private metrics = {
    messagesSent: 0,
    messagesReceived: 0,
    errorsCount: 0,
    averageLatency: 0,
    connectionUptime: 0,
    lastConnectionTime: 0
  };
  private latencyHistory: number[] = [];

  constructor(wsClient: ClientWsTransport) {
    this.setupMonitoring();
  }

  // Monitor connection events and message metrics
  private setupMonitoring() {
    this.wsClient.on(ClientWsTransportEvents.OPEN, () => {
      this.metrics.lastConnectionTime = Date.now();
    });

    this.wsClient.on(ClientWsTransportEvents.MESSAGE, () => {
      this.metrics.messagesReceived++;
    });

    this.wsClient.on(ClientWsTransportEvents.ERROR, () => {
      this.metrics.errorsCount++;
    });

    // Wrap send method to track latency
    this.wrapSendMethod();
  }

  // Get performance metrics
  public getMetrics() {
    return {
      ...this.metrics,
      connected: this.wsClient.getConnectionStatus(),
      latencyHistory: [...this.latencyHistory]
    };
  }
}
```
```

## API Reference

### ClientWsTransport

#### Constructor

```typescript
new ClientWsTransport(host: string, port: number, shouldReconnect?: boolean)
```

- **host**: WebSocket server hostname
- **port**: WebSocket server port
- **shouldReconnect**: Enable automatic reconnection (default: true)

#### Methods

##### Connection Management

- **`connect(url?: string): void`** - Establish WebSocket connection
- **`disconnect(): void`** - Close WebSocket connection
- **`reconnect(): void`** - Reconnect to WebSocket server
- **`getConnectionStatus(): boolean`** - Check if connection is active

##### Message Operations

- **`send(type: DevtoolEvents, payload: any): Promise<void>`** - Send message to server
- **`handshake(appId: string): Promise<void>`** - Perform handshake protocol

##### Event Handling

- **`on(event: ClientWsTransportEvents, listener: Function): this`** - Add event listener
- **`off(event: ClientWsTransportEvents, listener: Function): this`** - Remove event listener

## Best Practices

### 1. Connection Management
- Set reasonable reconnection strategies and retry limits
- Implement appropriate connection timeouts and heartbeat mechanisms
- Monitor connection status and network quality
- Handle intermittent network issues and connection interruptions

### 2. Message Processing
- Use appropriate message serialization and deserialization
- Implement message caching and queue management
- Handle large message fragmentation and reassembly
- Implement message encryption and compression when needed

### 3. Error Handling
- Establish comprehensive error classification and handling strategies
- Implement intelligent retry and recovery mechanisms
- Log detailed error information and debugging data
- Provide user-friendly error messages and resolution suggestions

### 4. Performance Optimization
- Monitor and optimize message transmission latency and throughput
- Use message batching and queuing appropriately
- Implement proper memory management and resource cleanup
- Optimize network usage and bandwidth consumption

### 5. Security Considerations
- Implement appropriate authentication and authorization mechanisms
- Use secure WebSocket connections (WSS) in production
- Validate and filter incoming message data
- Avoid exposing sensitive information and credentials

## Troubleshooting

### Common Issues

#### Connection Failed
```bash
Error: WebSocket connection failed
```
**Solution**: Check server address, port configuration, network connection, and firewall settings.

#### Message Send Failed
```bash
Error: WebSocket connection not OPEN
```
**Solution**: Check connection status, implement message queuing, and wait for connection establishment.

#### Handshake Failed
```bash
Error: Handshake failed
```
**Solution**: Check application ID configuration, server status, and protocol version compatibility.

#### Message Parse Error
```bash
SyntaxError: Unexpected token in JSON
```
**Solution**: Check message format, JSON serialization, and data encoding issues.

### Debugging Tips

```typescript
// Enable detailed debug logging
const wsClient = new ClientWsTransport('localhost', 3001, true);

// Listen to all events
wsClient.on(ClientWsTransportEvents.OPEN, () => {
  console.log('Connection established');
});

wsClient.on(ClientWsTransportEvents.MESSAGE, (message) => {
  console.log('Message received:', message);
});

wsClient.on(ClientWsTransportEvents.ERROR, (error) => {
  console.error('Connection error:', error);
});

wsClient.on(ClientWsTransportEvents.CLOSE, () => {
  console.log('Connection closed');
});

// Check connection status
console.log('Connection status:', wsClient.getConnectionStatus());

// Check WebSocket native object
console.log('WebSocket readyState:', wsClient.connection?.readyState);
```

## Integration with Testring Framework

### With Devtools Backend

```typescript
import { ClientWsTransport } from '@testring/client-ws-transport';
import { DevtoolBackend } from '@testring/devtool-backend';

// Create transport for devtools communication
const transport = new ClientWsTransport('localhost', 3001);

// Use with devtools backend
const devtools = new DevtoolBackend(transport);
```

### Event-Driven Testing

```typescript
// Use in test scenarios
wsClient.on(ClientWsTransportEvents.MESSAGE, (message) => {
  if (message.type === DevtoolEvents.MESSAGE) {
    switch (message.payload.action) {
      case 'test.complete':
        handleTestCompletion(message.payload);
        break;
      case 'error.occurred':
        handleTestError(message.payload);
        break;
    }
  }
});
```

## Dependencies

- **`@testring/types`** - TypeScript type definitions
- **`@testring/utils`** - Utility functions and helpers
- **`events`** - Node.js event system

## Related Modules

- **`@testring/devtool-backend`** - Development tools backend
- **`@testring/transport`** - Transport layer communication
- **`@testring/logger`** - Logging system

## License

MIT License - see the [LICENSE](https://github.com/ringcentral/testring/blob/master/LICENSE) file for details.