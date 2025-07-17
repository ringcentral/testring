# @testring/api

Test API controller module that provides the core API interface and test execution control functionality for the testring framework.

## Overview

This module serves as the core API layer of the testring framework, responsible for:
- Providing the main entry points and lifecycle management for test execution
- Managing test state, parameters, and environment variables
- Handling test event publishing and subscription
- Providing test context and tools (HTTP client, web applications, etc.)
- Integrating asynchronous breakpoints and logging functionality

## Key Features

### Test Lifecycle Management
- **Complete test lifecycle control**: Full process management from test start to finish
- **Callback mechanism**: Support for beforeRun and afterRun callback registration
- **Asynchronous breakpoint support**: Integration with @testring/async-breakpoints

### Test State Management
- **Test ID management**: Unique identification for each test
- **Parameter management**: Support for setting and getting test parameters and environment parameters
- **Event bus**: Unified event publishing and subscription mechanism

### Test Context
- **Integrated tools**: HTTP client, web applications, logging, etc.
- **Custom applications**: Support for custom web application instances
- **Parameter access**: Convenient access to parameters and environment variables

## Installation

```bash
npm install @testring/api
```

## Main Components

### 1. TestAPIController

Test API controller that manages test execution state and parameters:

```typescript
import { testAPIController } from '@testring/api';

// Set test ID
testAPIController.setTestID('user-login-test');

// Set test parameters
testAPIController.setTestParameters({
  username: 'testuser',
  password: 'testpass',
  timeout: 5000
});

// Set environment parameters
testAPIController.setEnvironmentParameters({
  baseUrl: 'https://api.example.com',
  apiKey: 'secret-key'
});

// Get current test ID
const testId = testAPIController.getTestID();

// Get test parameters
const params = testAPIController.getTestParameters();

// Get environment parameters
const env = testAPIController.getEnvironmentParameters();
```

### 2. BusEmitter

Event bus that handles test event publishing and subscription:

```typescript
import { testAPIController } from '@testring/api';

const bus = testAPIController.getBus();

// Listen to test events
bus.on('started', () => {
  console.log('Test execution started');
});

bus.on('finished', () => {
  console.log('Test execution completed');
});

bus.on('failed', (error: Error) => {
  console.error('Test execution failed:', error.message);
});

// Manually trigger events
await bus.startedTest();
await bus.finishedTest();
await bus.failedTest(new Error('Test failed'));
```

### 3. run Function

Main entry point for test execution:

```typescript
import { run, beforeRun, afterRun } from '@testring/api';

// Register lifecycle callbacks
beforeRun(() => {
  console.log('Preparing to execute test');
});

afterRun(() => {
  console.log('Test execution completed');
});

// Define test function
const loginTest = async (api) => {
  await api.log('Starting login test');

  // Use HTTP client
  const response = await api.http.post('/login', {
    username: 'testuser',
    password: 'testpass'
  });

  await api.log('Login request completed', response.status);

  // Use web application
  await api.application.url('https://example.com/dashboard');
  const title = await api.application.getTitle();

  await api.log('Page title:', title);
};

// Execute test
await run(loginTest);
```

### 4. TestContext

Test context class that provides test environment and tools:

```typescript
// Use in test function
const myTest = async (api) => {
  // HTTP client
  const response = await api.http.get('/api/users');

  // Web application operations
  await api.application.url('https://example.com');
  const element = await api.application.findElement('#login-button');
  await element.click();

  // Logging
  await api.log('User operation completed');
  await api.logWarning('This is a warning');
  await api.logError('This is an error');

  // Business logging
  await api.logBusiness('User login flow');
  // ... execute business logic
  await api.stopLogBusiness();

  // Get parameters
  const params = api.getParameters();
  const env = api.getEnvironment();

  // Custom application
  const customApp = api.initCustomApplication(MyCustomWebApp);
  await customApp.doSomething();
};
```

## Complete Usage Examples

### Basic Test Example

```typescript
import { run, testAPIController, beforeRun, afterRun } from '@testring/api';

// Set test configuration
testAPIController.setTestID('e2e-user-workflow');
testAPIController.setTestParameters({
  username: 'testuser@example.com',
  password: 'securepass123',
  timeout: 10000
});

testAPIController.setEnvironmentParameters({
  baseUrl: 'https://staging.example.com',
  apiKey: 'staging-api-key'
});

// Register lifecycle callbacks
beforeRun(async () => {
  console.log('Test preparation phase');
  // Initialize test data
  await setupTestData();
});

afterRun(async () => {
  console.log('Test cleanup phase');
  // Clean up test data
  await cleanupTestData();
});

// Define test function
const userRegistrationTest = async (api) => {
  await api.logBusiness('User registration flow test');

  try {
    // Step 1: Visit registration page
    await api.application.url(`${api.getEnvironment().baseUrl}/register`);
    await api.log('Visited registration page');

    // Step 2: Fill registration form
    const params = api.getParameters();
    await api.application.setValue('#email', params.username);
    await api.application.setValue('#password', params.password);
    await api.application.click('#register-btn');

    // Step 3: Verify registration success
    const successMessage = await api.application.getText('.success-message');
    await api.log('Registration success message:', successMessage);

    // Step 4: API verification
    const response = await api.http.get('/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${api.getEnvironment().apiKey}`
      }
    });

    await api.log('User profile retrieved successfully', response.data);

  } catch (error) {
    await api.logError('Test execution failed:', error);
    throw error;
  } finally {
    await api.stopLogBusiness();
  }
};

// Execute test
await run(userRegistrationTest);
```

### Multiple Test Functions Example

```typescript
import { run } from '@testring/api';

const loginTest = async (api) => {
  await api.logBusiness('User login test');

  await api.application.url('/login');
  await api.application.setValue('#username', 'testuser');
  await api.application.setValue('#password', 'testpass');
  await api.application.click('#login-btn');

  const dashboard = await api.application.findElement('.dashboard');
  await api.log('Login successful, entered dashboard');

  await api.stopLogBusiness();
};

const profileTest = async (api) => {
  await api.logBusiness('User profile test');

  await api.application.click('#profile-link');
  const profileData = await api.application.getText('.profile-info');
  await api.log('User profile:', profileData);

  await api.stopLogBusiness();
};

const logoutTest = async (api) => {
  await api.logBusiness('User logout test');

  await api.application.click('#logout-btn');
  const loginForm = await api.application.findElement('#login-form');
  await api.log('Logout successful, returned to login page');

  await api.stopLogBusiness();
};

// Execute multiple tests in sequence
await run(loginTest, profileTest, logoutTest);
```

### Custom Application Example

```typescript
import { WebApplication } from '@testring/web-application';

class CustomWebApp extends WebApplication {
  async loginWithCredentials(username: string, password: string) {
    await this.url('/login');
    await this.setValue('#username', username);
    await this.setValue('#password', password);
    await this.click('#login-btn');

    // Wait for login completion
    await this.waitForElement('.dashboard', 5000);
  }

  async getUnreadNotifications() {
    const notifications = await this.findElements('.notification.unread');
    return notifications.length;
  }
}

const customAppTest = async (api) => {
  const customApp = api.initCustomApplication(CustomWebApp);

  await customApp.loginWithCredentials('testuser', 'testpass');
  const unreadCount = await customApp.getUnreadNotifications();

  await api.log(`Unread notification count: ${unreadCount}`);

  // Access custom application list
  const customApps = api.getCustomApplicationsList();
  await api.log(`Custom application count: ${customApps.length}`);
};
```

## Error Handling

```typescript
import { run, testAPIController } from '@testring/api';

// Listen to test failure events
const bus = testAPIController.getBus();
bus.on('failed', (error: Error) => {
  console.error('Test failure details:', {
    testId: testAPIController.getTestID(),
    error: error.message,
    stack: error.stack
  });
});

const errorHandlingTest = async (api) => {
  try {
    await api.logBusiness('Error handling test');

    // Operation that might fail
    await api.application.url('/invalid-url');

  } catch (error) {
    await api.logError('Caught error:', error);

    // Can choose to re-throw or handle the error
    throw error;
  } finally {
    await api.stopLogBusiness();
  }
};

await run(errorHandlingTest);
```

## Performance Optimization

### HTTP Request Optimization
```typescript
const optimizedHttpTest = async (api) => {
  // Configure HTTP client
  const httpOptions = {
    timeout: 5000,
    retries: 3,
    headers: {
      'User-Agent': 'testring-test-client'
    }
  };

  // Concurrent requests
  const [user, posts, comments] = await Promise.all([
    api.http.get('/api/user', httpOptions),
    api.http.get('/api/posts', httpOptions),
    api.http.get('/api/comments', httpOptions)
  ]);

  await api.log('Concurrent requests completed');
};
```

### Resource Cleanup
```typescript
afterRun(async () => {
  // Ensure all resources are properly cleaned up
  await api.end();
});
```

## Configuration Options

### TestAPIController Configuration
```typescript
interface TestAPIControllerOptions {
  testID: string;                    // Test ID
  testParameters: object;            // Test parameters
  environmentParameters: object;     // Environment parameters
}
```

### TestContext Configuration
```typescript
interface TestContextConfig {
  httpThrottle?: number;             // HTTP request throttling
  runData?: ITestQueuedTestRunData;  // Run data
}
```

## Event Types

```typescript
enum TestEvents {
  started = 'started',               // Test started
  finished = 'finished',             // Test completed
  failed = 'failed'                  // Test failed
}
```

## Dependencies

- `@testring/web-application` - Web application testing functionality
- `@testring/async-breakpoints` - Asynchronous breakpoint support
- `@testring/logger` - Logging system
- `@testring/http-api` - HTTP client
- `@testring/transport` - Transport layer
- `@testring/utils` - Utility functions
- `@testring/types` - Type definitions

## Related Modules

- `@testring/test-run-controller` - Test run controller
- `@testring/test-worker` - Test worker process
- `@testring/cli` - Command line interface
- `@testring/async-assert` - Asynchronous assertion library

## Best Practices

1. **Set meaningful test IDs**: Use descriptive test IDs for easy log tracking
2. **Parameter management**: Separate variable parameters and environment variables
3. **Lifecycle callbacks**: Use beforeRun and afterRun appropriately for initialization and cleanup
4. **Error handling**: Listen to test events and implement comprehensive error handling mechanisms
5. **Resource cleanup**: Ensure all resources are properly cleaned up when tests end