# Testing Best Practices

This guide outlines best practices for writing effective tests with testring.

## Test Organization

### File Structure

Organize your tests in a logical directory structure:

```
test/
├── unit/                 # Unit tests
├── integration/          # Integration tests
├── e2e/                 # End-to-end tests
├── fixtures/            # Test data and fixtures
├── helpers/             # Test helper functions
└── config/              # Test configurations
```

### Naming Conventions

Use descriptive and consistent naming:

```javascript
// Good: Descriptive test names
describe('User Authentication', () => {
    it('should login with valid credentials', async () => {
        // Test implementation
    });
    
    it('should show error message for invalid credentials', async () => {
        // Test implementation
    });
});

// Bad: Vague test names
describe('Login', () => {
    it('works', async () => {
        // Test implementation
    });
});
```

## Writing Effective Tests

### Test Independence

Each test should be independent and not rely on other tests:

```javascript
// Good: Independent tests
describe('Shopping Cart', () => {
    beforeEach(async () => {
        await browser.url('/cart');
        await clearCart();
    });
    
    it('should add item to cart', async () => {
        await addItemToCart('product-1');
        const count = await getCartItemCount();
        expect(count).to.equal(1);
    });
    
    it('should remove item from cart', async () => {
        await addItemToCart('product-1');
        await removeItemFromCart('product-1');
        const count = await getCartItemCount();
        expect(count).to.equal(0);
    });
});
```

### Use Page Object Model

Organize your UI interactions using the Page Object Model:

```javascript
// pages/LoginPage.js
class LoginPage {
    get usernameInput() { return browser.$('#username'); }
    get passwordInput() { return browser.$('#password'); }
    get loginButton() { return browser.$('#login-btn'); }
    get errorMessage() { return browser.$('.error-message'); }
    
    async login(username, password) {
        await this.usernameInput.setValue(username);
        await this.passwordInput.setValue(password);
        await this.loginButton.click();
    }
    
    async getErrorMessage() {
        await this.errorMessage.waitForDisplayed();
        return await this.errorMessage.getText();
    }
}

module.exports = new LoginPage();

// test/login.spec.js
const LoginPage = require('../pages/LoginPage');

describe('Login Functionality', () => {
    it('should login successfully', async () => {
        await browser.url('/login');
        await LoginPage.login('user@example.com', 'password123');
        
        await browser.waitUntil(
            async () => (await browser.getUrl()).includes('/dashboard'),
            { timeout: 5000, timeoutMsg: 'Expected to be redirected to dashboard' }
        );
    });
});
```

### Reliable Element Selection

Use stable selectors that won't break easily:

```javascript
// Good: Use data attributes
const submitButton = await browser.$('[data-test-id="submit-button"]');

// Good: Use semantic selectors
const heading = await browser.$('h1');

// Acceptable: Use specific CSS selectors
const navItem = await browser.$('nav .menu-item:first-child');

// Bad: Fragile selectors
const element = await browser.$('div > div:nth-child(3) > span');
```

### Proper Waiting Strategies

Always wait for elements and conditions:

```javascript
// Good: Wait for element to be displayed
const element = await browser.$('#my-element');
await element.waitForDisplayed({ timeout: 5000 });

// Good: Wait for specific conditions
await browser.waitUntil(
    async () => {
        const elements = await browser.$$('.list-item');
        return elements.length > 0;
    },
    { timeout: 10000, timeoutMsg: 'Expected list items to appear' }
);

// Bad: No waiting
const element = await browser.$('#my-element');
await element.click(); // May fail if element not ready
```

## Test Data Management

### Use Fixtures

Store test data in separate files:

```javascript
// fixtures/users.json
{
    "validUser": {
        "email": "test@example.com",
        "password": "password123"
    },
    "invalidUser": {
        "email": "invalid@example.com",
        "password": "wrongpassword"
    }
}

// test/login.spec.js
const users = require('../fixtures/users.json');

describe('Login Tests', () => {
    it('should login with valid user', async () => {
        await LoginPage.login(users.validUser.email, users.validUser.password);
        // Assert success
    });
});
```

### Dynamic Test Data

Generate dynamic data to avoid conflicts:

```javascript
const faker = require('faker');

describe('User Registration', () => {
    it('should register new user', async () => {
        const userData = {
            email: faker.internet.email(),
            password: faker.internet.password(),
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName()
        };
        
        await RegistrationPage.register(userData);
        // Assert registration success
    });
});
```

## Error Handling and Debugging

### Comprehensive Error Messages

Provide clear error messages:

```javascript
// Good: Descriptive assertions
const actualTitle = await browser.getTitle();
expect(actualTitle).to.equal('Expected Page Title', 
    `Expected page title to be 'Expected Page Title' but got '${actualTitle}'`);

// Good: Custom error messages
await browser.waitUntil(
    async () => (await browser.getUrl()).includes('/success'),
    { 
        timeout: 5000, 
        timeoutMsg: 'Expected to be redirected to success page after form submission' 
    }
);
```

### Screenshots on Failure

Capture screenshots when tests fail:

```javascript
// In your test configuration or afterEach hook
afterEach(async function() {
    if (this.currentTest.state === 'failed') {
        const testName = this.currentTest.title.replace(/\s+/g, '_');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${testName}_${timestamp}.png`;
        
        await browser.saveScreenshot(`./screenshots/${filename}`);
        console.log(`Screenshot saved: ${filename}`);
    }
});
```

## Performance Optimization

### Parallel Execution

Configure appropriate parallelization:

```json
{
    "workerLimit": 4,
    "retryCount": 1,
    "timeout": 30000
}
```

### Efficient Test Structure

Group related tests and use setup/teardown efficiently:

```javascript
describe('E-commerce Workflow', () => {
    before(async () => {
        // One-time setup for all tests
        await setupTestDatabase();
    });
    
    beforeEach(async () => {
        // Setup for each test
        await browser.url('/');
        await clearBrowserStorage();
    });
    
    after(async () => {
        // One-time cleanup
        await cleanupTestDatabase();
    });
    
    // Group related tests
    describe('Product Search', () => {
        it('should find products by name', async () => {
            // Test implementation
        });
        
        it('should filter products by category', async () => {
            // Test implementation
        });
    });
});
```

## Continuous Integration

### CI-Friendly Configuration

Configure tests for CI environments:

```json
{
    "plugins": [
        ["@testring/plugin-playwright-driver", {
            "headless": true,
            "args": [
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu"
            ]
        }]
    ],
    "retryCount": 2,
    "timeout": 60000
}
```

### Environment-Specific Configs

Use different configurations for different environments:

```javascript
// testring.config.js
const baseConfig = {
    tests: './test/**/*.spec.js',
    plugins: ['@testring/plugin-babel']
};

const environments = {
    local: {
        ...baseConfig,
        plugins: [
            ...baseConfig.plugins,
            ['@testring/plugin-playwright-driver', { headless: false }]
        ]
    },
    ci: {
        ...baseConfig,
        plugins: [
            ...baseConfig.plugins,
            ['@testring/plugin-playwright-driver', { 
                headless: true,
                args: ['--no-sandbox', '--disable-dev-shm-usage']
            }]
        ],
        retryCount: 2
    }
};

module.exports = environments[process.env.NODE_ENV] || environments.local;
```

## Code Quality

### Linting and Formatting

Use ESLint and Prettier for consistent code style:

```json
// .eslintrc.js
module.exports = {
    extends: ['eslint:recommended'],
    env: {
        node: true,
        mocha: true
    },
    globals: {
        browser: 'readonly',
        expect: 'readonly'
    }
};
```

### Code Reviews

Establish code review practices:

1. Review test logic and assertions
2. Check for proper error handling
3. Verify test independence
4. Ensure good naming conventions
5. Validate test data management

## Documentation

### Test Documentation

Document complex test scenarios:

```javascript
/**
 * Test the complete user registration workflow
 * 
 * This test covers:
 * 1. Form validation
 * 2. Email verification
 * 3. Account activation
 * 4. First login
 * 
 * Prerequisites:
 * - Email service must be running
 * - Database must be clean
 */
describe('User Registration Workflow', () => {
    // Test implementation
});
```

### Maintain Test Inventory

Keep track of test coverage and scenarios in documentation.

## Summary

Following these best practices will help you:

- Write maintainable and reliable tests
- Reduce test flakiness
- Improve debugging capabilities
- Scale your test suite effectively
- Integrate smoothly with CI/CD pipelines

For more specific guidance, see:
- [API Reference](../api/README.md)
- [Configuration Guide](../configuration/README.md)
- [Troubleshooting Guide](troubleshooting.md)
