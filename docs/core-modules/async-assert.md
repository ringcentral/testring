# @testring/async-assert

Asynchronous assertion library based on Chai, providing complete asynchronous assertion support for the testring framework.

## Overview

This module is an asynchronous wrapper for the Chai assertion library, offering:
- Conversion of all Chai assertion methods to asynchronous versions
- Support for both soft and hard assertion modes
- Error collection and custom handling mechanisms
- Full TypeScript type support

## Key Features

### Asynchronous Assertion Support
- All assertion methods return Promises
- Adaptation to asynchronous test environments
- Perfect integration with multi-process test frameworks

### Soft Assertion Mechanism
- **Hard Assertion**: Throws an error immediately on failure (default mode)
- **Soft Assertion**: Collects errors on failure and continues executing subsequent assertions

### Error Handling
- Automatic collection of assertion failure information
- Support for custom success/failure callbacks
- Detailed error context provided

## Installation

```bash
npm install @testring/async-assert
```

## Basic Usage

### Creating Assertion Instances

```typescript
import { createAssertion } from '@testring/async-assert';

// Create default assertion instance (hard assertion mode)
const assert = createAssertion();

// Create soft assertion instance
const softAssert = createAssertion({ isSoft: true });
```

### Asynchronous Assertion Examples

```typescript
// Basic assertions
await assert.equal(actual, expected, 'Values should be equal');
await assert.isTrue(condition, 'Condition should be true');
await assert.lengthOf(array, 3, 'Array length should be 3');

// Type assertions
await assert.isString(value, 'Value should be a string');
await assert.isNumber(count, 'Count should be a number');
await assert.isArray(list, 'Should be an array');

// Inclusion assertions
await assert.include(haystack, needle, 'Should include the specified value');
await assert.property(object, 'prop', 'Object should have the specified property');

// Exception assertions
await assert.throws(() => {
  throw new Error('Test error');
}, 'Should throw an error');
```

## Soft Assertion Mode

Soft assertions allow tests to continue execution even if some assertions fail:

```typescript
import { createAssertion } from '@testring/async-assert';

const assert = createAssertion({ isSoft: true });

// Execute multiple assertions
await assert.equal(user.name, 'John', 'Username check');
await assert.equal(user.age, 25, 'Age check');
await assert.isTrue(user.isActive, 'Active status check');

// Get all error messages
const errors = assert._errorMessages;
if (errors.length > 0) {
  console.log('Found the following assertion failures:');
  errors.forEach(error => console.log('- ' + error));
}
```

## Custom Callback Handling

```typescript
const assert = createAssertion({
  onSuccess: async (data) => {
    console.log(`✓ ${data.assertMessage}`);
    // Log successful assertions
  },
  
  onError: async (data) => {
    console.log(`✗ ${data.assertMessage}`);
    console.log(`  Error: ${data.errorMessage}`);
    
    // Can return custom error object
    return new Error(`Custom error: ${data.errorMessage}`);
  }
});

await assert.equal(actual, expected);
```

## Supported Assertion Methods

### Equality Assertions
```typescript
await assert.equal(actual, expected);          // Non-strict equality (==)
await assert.notEqual(actual, expected);       // Non-strict inequality (!=)
await assert.strictEqual(actual, expected);    // Strict equality (===)
await assert.notStrictEqual(actual, expected); // Strict inequality (!==)
await assert.deepEqual(actual, expected);      // Deep equality
await assert.notDeepEqual(actual, expected);   // Deep inequality
```

### Truthiness Assertions
```typescript
await assert.ok(value);                        // Truthy check
await assert.notOk(value);                     // Falsy check
await assert.isTrue(value);                    // Strict true
await assert.isFalse(value);                   // Strict false
await assert.isNotTrue(value);                 // Not true
await assert.isNotFalse(value);                // Not false
```

### Type Assertions
```typescript
await assert.isString(value);                  // String type
await assert.isNumber(value);                  // Number type
await assert.isBoolean(value);                 // Boolean type
await assert.isArray(value);                   // Array type
await assert.isObject(value);                  // Object type
await assert.isFunction(value);                // Function type
await assert.typeOf(value, 'string');          // Type check
await assert.instanceOf(value, Array);         // Instance check
```

### Null/Undefined Assertions
```typescript
await assert.isNull(value);                    // null check
await assert.isNotNull(value);                 // Not null check
await assert.isUndefined(value);               // undefined check
await assert.isDefined(value);                 // Defined check
await assert.exists(value);                    // Exists check
await assert.notExists(value);                 // Not exists check
```

### Numeric Assertions
```typescript
await assert.isAbove(valueToCheck, valueToBeAbove);      // Greater than
await assert.isAtLeast(valueToCheck, valueToBeAtLeast);  // Greater than or equal
await assert.isBelow(valueToCheck, valueToBeBelow);      // Less than
await assert.isAtMost(valueToCheck, valueToBeAtMost);    // Less than or equal
await assert.closeTo(actual, expected, delta);           // Approximately equal
```

### Inclusion Assertions
```typescript
await assert.include(haystack, needle);        // Inclusion check
await assert.notInclude(haystack, needle);     // Non-inclusion check
await assert.deepInclude(haystack, needle);    // Deep inclusion
await assert.property(object, 'prop');         // Property exists
await assert.notProperty(object, 'prop');      // Property doesn't exist
await assert.propertyVal(object, 'prop', val); // Property value check
await assert.lengthOf(object, length);         // Length check
```

### Exception Assertions
```typescript
await assert.throws(() => {
  throw new Error('test');
});                                             // Throws exception

await assert.doesNotThrow(() => {
  // Normal code
});                                             // Doesn't throw exception
```

### Collection Assertions
```typescript
await assert.sameMembers(set1, set2);          // Same members
await assert.sameDeepMembers(set1, set2);      // Same deep members
await assert.includeMembers(superset, subset); // Include members
await assert.oneOf(value, list);               // Value in list
```

## Plugin Support

Supports Chai plugins to extend assertion functionality:

```typescript
import chaiAsPromised from 'chai-as-promised';

const assert = createAssertion({
  plugins: [chaiAsPromised]
});

// Now you can use assertions provided by the plugin
await assert.eventually.equal(promise, expectedValue);
```

## Configuration Options

```typescript
interface IAssertionOptions {
  isSoft?: boolean;                    // Whether to use soft assertion mode
  plugins?: Array<ChaiPlugin>;        // Chai plugin list
  onSuccess?: (data: SuccessData) => Promise<void>;  // Success callback
  onError?: (data: ErrorData) => Promise<Error | void>; // Error callback
}
```

### Callback Data Structures

```typescript
interface SuccessData {
  isSoft: boolean;                     // Whether soft assertion
  successMessage: string;              // Success message
  assertMessage: string;               // Assertion message
  args: any[];                         // Assertion arguments
  originalMethod: string;              // Original method name
}

interface ErrorData {
  isSoft: boolean;                     // Whether soft assertion
  successMessage: string;              // Success message
  assertMessage: string;               // Assertion message
  errorMessage: string;                // Error message
  error: Error;                        // Error object
  args: any[];                         // Assertion arguments
  originalMethod: string;              // Original method name
}
```

## Integration with testring Framework

Using in testring tests:

```typescript
import { createAssertion } from '@testring/async-assert';

// In test file
const assert = createAssertion();

describe('User Management Tests', () => {
  it('should be able to create a user', async () => {
    const user = await createUser({ name: 'John', age: 25 });
    
    await assert.equal(user.name, 'John', 'Username should be correct');
    await assert.equal(user.age, 25, 'Age should be correct');
    await assert.property(user, 'id', 'Should have user ID');
    await assert.isString(user.id, 'ID should be a string');
  });
});
```

## Performance Optimization

### Batch Assertions
```typescript
// Batch validation in soft assertion mode
const assert = createAssertion({ isSoft: true });

const validateUser = async (user) => {
  await assert.isString(user.name, 'Name must be a string');
  await assert.isNumber(user.age, 'Age must be a number');
  await assert.isAbove(user.age, 0, 'Age must be greater than 0');
  await assert.isBelow(user.age, 150, 'Age must be less than 150');
  await assert.match(user.email, /\S+@\S+\.\S+/, 'Invalid email format');
  
  return assert._errorMessages;
};
```

## Error Handling Best Practices

```typescript
const assert = createAssertion({
  isSoft: true,
  onError: async (data) => {
    // Log detailed assertion failure information
    console.error(`Assertion failed: ${data.originalMethod}`);
    console.error(`Arguments: ${JSON.stringify(data.args)}`);
    console.error(`Error: ${data.errorMessage}`);
    
    // Can send to monitoring system
    // sendToMonitoring(data);
  }
});
```

## Dependencies

- `chai` - Underlying assertion library
- `@testring/types` - Type definitions

## Related Modules

- `@testring/test-worker` - Test worker process
- `@testring/api` - Test API controller
- `@testring/logger` - Logging system
