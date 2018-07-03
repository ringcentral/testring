import * as chai from 'chai';
import { loggerClient } from '@testring/logger';

export class WebAssert {

    public errorMessages: any;

    constructor(isSoft = false) {
        this.errorMessages = [];

        const makeAssert = (methodName) => {
            const typeOfAssert = isSoft ? 'softAssert' : 'assert';

            const callback = chai.assert[methodName];
            const methodAsString = this[methodName].toString().replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg, '');
            const methodArgs = methodAsString.slice(methodAsString.indexOf('(') + 1, methodAsString.indexOf(')')).match(/([^\s,]+)/g) || [];

            return async (...args) => {
                let successMessage = callback.length === args.length ? args.pop() : '';
                let assertMessage = typeOfAssert + '.' + methodName;
                let assertArguments: any = [];
                for (let index = 0; index < methodArgs.length; index++) {
                    if (index === args.length) {
                        break;
                    }
                    assertArguments.push(methodArgs[index] + ' = ' + (typeof args[index] !== 'undefined' ? JSON.stringify(args[index]) : 'undefined'));
                }
                assertMessage += '(' + assertArguments.join(', ') + ')';

                try {
                    callback(...args);
                    if (successMessage) {
                        await loggerClient.info(successMessage);
                        //TODO makeScreenShot
                        await loggerClient.info(assertMessage);
                    } else {
                        await loggerClient.info(assertMessage);
                        //TODO makeScreenShot
                    }
                } catch (error) {
                    if (successMessage) {
                        await loggerClient.warn(successMessage);
                        //TODO makeScreenShot
                        await loggerClient.error(assertMessage);
                    } else {
                         await loggerClient.warn(assertMessage);
                    }
                    if (isSoft) {
                        this.errorMessages.push(successMessage || assertMessage || error.message);
                    } else {
                        error.message = (successMessage || assertMessage || error.message);
                        throw error;
                    }
                }
            };
        };

        Object.keys(chai.assert).forEach((methodName) => {
            if (typeof this[methodName] === 'function') {
                this[methodName] = makeAssert(methodName);
            }
        });
    }
    /**
     * ### .isOk(object, [successMessage])
     *
     * Asserts that `object` is truthy.
     *
     *     isOk('everything', 'everything is ok');
     *     isOk(false, 'this will fail');
     *
     * @param {*} object to test
     * @param {string} successMessage
     */

    isOk(object, successMessage = '') {}

    /**
     * ### .isNotOk(object, [successMessage])
     *
     * Asserts that `object` is falsy.
     *
     *     isNotOk('everything', 'this will fail');
     *     isNotOk(false, 'this will pass');
     *
     * @param {*} value to test
     * @param {string} successMessage
     */

    isNotOk(value, successMessage = '') {}

    /**
     * ### .equal(actual, expected, [successMessage])
     *
     * Asserts non-strict equality (`==`) of `actual` and `expected`.
     *
     *     equal(3, '3', '== coerces values to strings');
     *
     * @param {*} actual
     * @param {*} expected
     * @param {string} successMessage
     */

    equal(actual, expected, successMessage = '') {}

    /**
     * ### .notEqual(actual, expected, [successMessage])
     *
     * Asserts non-strict inequality (`!=`) of `actual` and `expected`.
     *
     *     notEqual(3, 4, 'these numbers are not equal');
     *
     * @param {*} actual
     * @param {*} expected
     * @param {string} successMessage
     */

    notEqual(actual, expected, successMessage = '') {}

    /**
     * ### .strictEqual(actual, expected, [successMessage])
     *
     * Asserts strict equality (`===`) of `actual` and `expected`.
     *
     *     strictEqual(true, true, 'these booleans are strictly equal');
     *
     * @param {*} actual
     * @param {*} expected
     * @param {string} successMessage
     */

    strictEqual(actual, expected, successMessage = '') {}

    /**
     * ### .notStrictEqual(actual, expected, [successMessage])
     *
     * Asserts strict inequality (`!==`) of `actual` and `expected`.
     *
     *     notStrictEqual(3, '3', 'no coercion for strict equality');
     *
     * @param {*} actual
     * @param {*} expected
     * @param {string} successMessage
     */

    notStrictEqual(actual, expected, successMessage = '') {}

    /**
     * ### .deepEqual(actual, expected, [successMessage])
     *
     * Asserts that `actual` is deeply equal to `expected`.
     *
     *     deepEqual({}, {});
     *
     * @param {*} actual
     * @param {*} expected
     * @param {string} successMessage
     */

    deepEqual(actual, expected, successMessage = '') {}

    /**
     * ### .notDeepEqual(actual, expected, [successMessage])
     *
     * Assert that `actual` is not deeply equal to `expected`.
     *
     *     notDeepEqual({}, {});
     *
     * @param {*} actual
     * @param {*} expected
     * @param {string} successMessage
     */

    notDeepEqual(actual, expected, successMessage = '') {}

    /**
     * ### .isAbove(valueToCheck, valueToBeAbove, [successMessage])
     *
     * Asserts `valueToCheck` is strictly greater than (>) `valueToBeAbove`
     *
     *     isAbove(5, 2, '5 is strictly greater than 2');
     *
     * @param {*} valueToCheck
     * @param {*} valueToBeAbove
     * @param {string} successMessage
     */

    isAbove(valueToCheck, valueToBeAbove, successMessage = '') {}

    /**
     * ### .isAtLeast(valueToCheck, valueToBeAtLeast, [successMessage])
     *
     * Asserts `valueToCheck` is greater than or equal to (>=) `valueToBeAtLeast`
     *
     *     isAtLeast(5, 2, '5 is greater or equal to 2');
     *     isAtLeast(3, 3, '3 is greater or equal to 3');
     *
     * @param {*} valueToCheck
     * @param {*} valueToBeAtLeast
     * @param {string} successMessage
     */

    isAtLeast(valueToCheck, valueToBeAtLeast, successMessage = '') {}

    /**
     * ### .isBelow(valueToCheck, valueToBeBelow, [successMessage])
     *
     * Asserts `valueToCheck` is strictly less than (<) `valueToBeBelow`
     *
     *     isBelow(3, 6, '3 is strictly less than 6');
     *
     * @param {*} valueToCheck
     * @param {*} valueToBeBelow
     * @param {string} successMessage
     */

    isBelow(valueToCheck, valueToBeBelow, successMessage = '') {}

    /**
     * ### .isAtMost(valueToCheck, valueToBeAtMost, [successMessage])
     *
     * Asserts `valueToCheck` is less than or equal to (<=) `valueToBeAtMost`
     *
     *     isAtMost(3, 6, '3 is less than or equal to 6');
     *     isAtMost(4, 4, '4 is less than or equal to 4');
     *
     * @param {*} valueToCheck
     * @param {*} valueToBeAtMost
     * @param {string} successMessage
     */

    isAtMost(valueToCheck, valueToBeAtMost, successMessage = '') {}

    /**
     * ### .isTrue(value, [successMessage])
     *
     * Asserts that `value` is true.
     *
     *     var teaServed = true;
     *     isTrue(teaServed, 'the tea has been served');
     *
     * @param {*} value
     * @param {string} successMessage
     */

    isTrue(value, successMessage = '') {}

    /**
     * ### .isNotTrue(value, [successMessage])
     *
     * Asserts that `value` is not true.
     *
     *     var tea = 'tasty chai';
     *     isNotTrue(tea, 'great, time for tea!');
     *
     * @param {*} value
     * @param {string} successMessage
     */

    isNotTrue(value, successMessage = '') {}

    /**
     * ### .isFalse(value, [successMessage])
     *
     * Asserts that `value` is false.
     *
     *     var teaServed = false;
     *     isFalse(teaServed, 'no tea yet? hmm...');
     *
     * @param {*} value
     * @param {string} successMessage
     */

    isFalse(value, successMessage = '') {}

    /**
     * ### .isNotFalse(value, [successMessage])
     *
     * Asserts that `value` is not false.
     *
     *     var tea = 'tasty chai';
     *     isNotFalse(tea, 'great, time for tea!');
     *
     * @param {*} value
     * @param {string} successMessage
     */

    isNotFalse(value, successMessage = '') {}

    /**
     * ### .isNull(value, [successMessage])
     *
     * Asserts that `value` is null.
     *
     *     isNull(err, 'there was no error');
     *
     * @param {*} value
     * @param {string} successMessage
     */

    isNull(value, successMessage = '') {}

    /**
     * ### .isNotNull(value, [successMessage])
     *
     * Asserts that `value` is not null.
     *
     *     var tea = 'tasty chai';
     *     isNotNull(tea, 'great, time for tea!');
     *
     * @param {*} value
     * @param {string} successMessage
     */

    isNotNull(value, successMessage = '') {}

    /**
     * ### .isNaN
     * Asserts that value is NaN
     *
     *    isNaN('foo', 'foo is NaN');
     *
     * @param {*} value
     * @param {string} successMessage
     */

    isNaN(value, successMessage = '') {}

    /**
     * ### .isNotNaN
     * Asserts that value is not NaN
     *
     *    isNotNaN(4, '4 is not NaN');
     *
     * @param {*} value
     * @param {string} successMessage
     */
    isNotNaN(value, successMessage = '') {}

    /**
     * ### .exists
     * Asserts that the target is neither null nor undefined.
     *
     *     var foo = 'hi';
     *     exists(foo, 'foo is neither `null` nor `undefined`');
     *
     * @param {*} value
     * @param {String} successMessage
     */
    exists(value, successMessage = '') {}

    /**
     * ### .notExists
     * Asserts that the target is either null or undefined.
     *
     *     var bar = null, baz;
     *     notExists(bar);
     *     notExists(baz, 'baz is either null or undefined');
     *
     * @param {*} value
     * @param {String} successMessage
     */
    notExists(value, successMessage = '') {}

    /**
     * ### .isUndefined(value, [successMessage])
     *
     * Asserts that `value` is `undefined`.
     *
     *     var tea;
     *     isUndefined(tea, 'no tea defined');
     *
     * @param {*} value
     * @param {string} successMessage
     */

    isUndefined(value, successMessage = '') {}

    /**
     * ### .isDefined(value, [successMessage])
     *
     * Asserts that `value` is not `undefined`.
     *
     *     var tea = 'cup of chai';
     *     isDefined(tea, 'tea has been defined');
     *
     * @param {*} value
     * @param {string} successMessage
     */

    isDefined(value, successMessage = '') {}

    /**
     * ### .isFunction(value, [successMessage])
     *
     * Asserts that `value` is a function.
     *
     *     function serveTea() {}
     *     isFunction(serveTea, 'great, we can have tea now');
     *
     * @param {*} value
     * @param {string} successMessage
     */

    isFunction(value, successMessage = '') {}

    /**
     * ### .isNotFunction(value, [successMessage])
     *
     * Asserts that `value` is _not_ a function.
     *
     *     var serveTea = [ 'heat', 'pour', 'sip' ];
     *     isNotFunction(serveTea, 'great, we have listed the steps');
     *
     * @param {*} value
     * @param {string} successMessage
     */

    isNotFunction(value, successMessage = '') {}

    /**
     * ### .isObject(value, [successMessage])
     *
     * Asserts that `value` is an object of type 'Object' (as revealed by `Object.prototype.toString`).
     * _The assertion does not match subclassed objects._
     *
     *     var selection = {}
     *     isObject(selection, 'tea selection is an object');
     *
     * @param {*} value
     * @param {string} successMessage
     */

    isObject(value, successMessage = '') {}

    /**
     * ### .isNotObject(value, [successMessage])
     *
     * Asserts that `value` is _not_ an object of type 'Object' (as revealed by `Object.prototype.toString`).
     *
     *     var selection = 'chai'
     *     isNotObject(selection, 'tea selection is not an object');
     *     isNotObject(null, 'null is not an object');
     *
     * @param {*} value
     * @param {string} successMessage
     */

    isNotObject(value, successMessage = '') {}

    /**
     * ### .isArray(value, [successMessage])
     *
     * Asserts that `value` is an array.
     *
     *     var menu = [ 'green', 'chai', 'oolong' ];
     *     isArray(menu, 'what kind of tea do we want?');
     *
     * @param {*} value
     * @param {string} successMessage
     */

    isArray(value, successMessage = '') {}

    /**
     * ### .isNotArray(value, [successMessage])
     *
     * Asserts that `value` is _not_ an array.
     *
     *     var menu = 'green|chai|oolong';
     *     isNotArray(menu, 'what kind of tea do we want?');
     *
     * @param {*} value
     * @param {string} successMessage
     */

    isNotArray(value, successMessage = '') {}

    /**
     * ### .isString(value, [successMessage])
     *
     * Asserts that `value` is a string.
     *
     *     var teaOrder = 'chai';
     *     isString(teaOrder, 'order placed');
     *
     * @param {*} value
     * @param {string} successMessage
     */

    isString(value, successMessage = '') {}

    /**
     * ### .isNotString(value, [successMessage])
     *
     * Asserts that `value` is _not_ a string.
     *
     *     var teaOrder = 4;
     *     isNotString(teaOrder, 'order placed');
     *
     * @param {*} value
     * @param {string} successMessage
     */

    isNotString(value, successMessage = '') {}

    /**
     * ### .isEmpty(value, [successMessage])
     *
     * Asserts that the target does not contain any values.
     * For arrays and strings, it checks the length property.
     * For Map and Set instances, it checks the size property.
     * For non-function objects, it gets the count of own enumerable string keys.
     *
     * @param { Object | Array | String | Map | Set } value
     * @param { String } successMessage _optional_
     */
    isEmpty(value, successMessage = '') {}

    /**
     * ### .isNumber(value, [successMessage])
     *
     * Asserts that `value` is a number.
     *
     *     var cups = 2;
     *     isNumber(cups, 'how many cups');
     *
     * @param {*} value
     * @param {string} successMessage
     */

    isNumber(value, successMessage = '') {}

    /**
     * ### .isNotNumber(value, [successMessage])
     *
     * Asserts that `value` is _not_ a number.
     *
     *     var cups = '2 cups please';
     *     isNotNumber(cups, 'how many cups');
     *
     * @param {*} value
     * @param {string} successMessage
     */

    isNotNumber(value, successMessage = '') {}

    /**
     * ### .isBoolean(value, [successMessage])
     *
     * Asserts that `value` is a boolean.
     *
     *     var teaReady = true
     *       , teaServed = false;
     *
     *     isBoolean(teaReady, 'is the tea ready');
     *     isBoolean(teaServed, 'has tea been served');
     *
     * @param {*} value
     * @param {string} successMessage
     */

    isBoolean(value, successMessage = '') {}

    /**
     * ### .isNotBoolean(value, [successMessage])
     *
     * Asserts that `value` is _not_ a boolean.
     *
     *     var teaReady = 'yep'
     *       , teaServed = 'nope';
     *
     *     isNotBoolean(teaReady, 'is the tea ready');
     *     isNotBoolean(teaServed, 'has tea been served');
     *
     * @param {*} value
     * @param {string} successMessage
     */

    isNotBoolean(value, successMessage = '') {}

    /**
     * ### .typeOf(value, type, [successMessage])
     *
     * Asserts that `value`'s type is `name`, as determined by
     * `Object.prototype.toString`.
     *
     *     typeOf({}, 'object', 'we have an object');
     *     typeOf(['chai', 'jasmine'], 'array', 'we have an array');
     *     typeOf('tea', 'string', 'we have a string');
     *     typeOf(/tea/, 'regexp', 'we have a regular expression');
     *     typeOf(null, 'null', 'we have a null');
     *     typeOf(undefined, 'undefined', 'we have an undefined');
     *
     * @param {*} value
     * @param {*} type
     * @param {string} successMessage
     */

    typeOf(value, type, successMessage = '') {}

    /**
     * ### .notTypeOf(value, name, [successMessage])
     *
     * Asserts that `value`'s type is _not_ `name`, as determined by
     * `Object.prototype.toString`.
     *
     *     notTypeOf('tea', 'number', 'strings are not numbers');
     *
     * @param {*} value
     * @param {*} type
     * @param {string} successMessage
     */

    notTypeOf(value, type, successMessage = '') {}

    /**
     * ### .instanceOf(object, constructor, [successMessage])
     *
     * Asserts that `value` is an instance of `constructor`.
     *
     *     var Tea(name) {}
     *       , chai = new Tea('chai');
     *
     *     instanceOf(chai, Tea, 'chai is an instance of tea');
     *
     * @param {*} object
     * @param {*} constructor
     * @param {string} successMessage
     */

    instanceOf(object, constructor, successMessage = '') {}

    /**
     * ### .notInstanceOf(object, constructor, [successMessage])
     *
     * Asserts `value` is not an instance of `constructor`.
     *
     *     var Tea(name) {}
     *       , chai = new String('chai');
     *
     *     notInstanceOf(chai, Tea, 'chai is not an instance of tea');
     *
     * @param {*} object
     * @param {*} constructor
     * @param {string} successMessage
     */

    notInstanceOf(object, constructor, successMessage = '') {}

    /**
     * ### .include(haystack, needle, [successMessage])
     *
     * Asserts that `haystack` includes `needle`. Works
     * for strings and arrays.
     *
     *     include('foobar', 'bar', 'foobar contains string "bar"');
     *     include([ 1, 2, 3 ], 3, 'array contains value');
     *
     * @param {*} haystack
     * @param {*} needle
     * @param {string} successMessage
     */

    include(haystack, needle, successMessage = '') {}

    /**
     * ### .notInclude(haystack, needle, [successMessage])
     *
     * Asserts that `haystack` does not include `needle`. Works
     * for strings and arrays.
     *
     *     notInclude('foobar', 'baz', 'string not include substring');
     *     notInclude([ 1, 2, 3 ], 4, 'array not include contain value');
     *
     * @param {*} haystack
     * @param {*} needle
     * @param {string} successMessage
     */

    notInclude(haystack, needle, successMessage = '') {}

    /**
     * ### .match(value, regexp, [successMessage])
     *
     * Asserts that `value` matches the regular expression `regexp`.
     *
     *     match('foobar', /^foo/, 'regexp matches');
     *
     * @param {*} value
     * @param {*} regexp
     * @param {string} successMessage
     */

    match(value, regexp, successMessage = '') {}

    /**
     * ### .notMatch(value, regexp, [successMessage])
     *
     * Asserts that `value` does not match the regular expression `regexp`.
     *
     *     notMatch('foobar', /^foo/, 'regexp does not match');
     *
     * @param {*} value
     * @param {*} regexp
     * @param {string} successMessage
     */

    notMatch(value, regexp, successMessage = '') {}

    /**
     * ### .property(object, property, [successMessage])
     *
     * Asserts that `object` has a property named by `property`.
     *
     *     property({}}, 'tea');
     *
     * @param {*} object
     * @param {*} property
     * @param {string} successMessage
     */

    property(object, property, successMessage = '') {}

    /**
     * ### .notProperty(object, property, [successMessage])
     *
     * Asserts that `object` does _not_ have a property named by `property`.
     *
     *     notProperty({}}, 'coffee');
     *
     * @param {*} object
     * @param {*} property
     * @param {string} successMessage
     */

    notProperty(object, property, successMessage = '') {}

    /**
     * ### .propertyVal(object, property, value, [successMessage])
     *
     * Asserts that `object` has a property named by `property` with value given
     * by `value`.
     *
     *     propertyVal({}, 'tea', 'is good');
     *
     * @param {*} object
     * @param {*} property
     * @param {*} value
     * @param {string} successMessage
     */

    propertyVal(object, property, value, successMessage = '') {}

    /**
     * ### .notPropertyVal(object, property, value, [successMessage])
     *
     * Asserts that `object` has a property named by `property`, but with a value
     * different from that given by `value`.
     *
     *     notPropertyVal({}, 'tea', 'is bad');
     *
     * @param {*} object
     * @param {*} property
     * @param {*} value
     * @param {string} successMessage
     */

    notPropertyVal(object, property, value, successMessage = '') {}

    /**
     * ### .deepPropertyVal(object, property, value, [successMessage])
     *
     * Asserts that `object` has a property named by `property` with value given
     * by `value`. `property` can use dot- and bracket-notation for deep
     * reference.
     *
     *     deepPropertyVal({}}, 'tea.green', 'matcha');
     *
     * @param {*} object
     * @param {*} property
     * @param {*} value
     * @param {string} successMessage
     */

    deepPropertyVal(object, property, value, successMessage = '') {}

    /**
     * ### .notDeepPropertyVal(object, property, value, [successMessage])
     *
     * Asserts that `object` has a property named by `property`, but with a value
     * different from that given by `value`. `property` can use dot- and
     * bracket-notation for deep reference.
     *
     *     notDeepPropertyVal({}}, 'tea.green', 'konacha');
     *
     * @param {*} object
     * @param {*} property
     * @param {*} value
     * @param {string} successMessage
     */

    notDeepPropertyVal(object, property, value, successMessage = '') {}

    /**
     * ### .lengthOf(object, length, [successMessage])
     *
     * Asserts that `object` has a `length` property with the expected value.
     *
     *     lengthOf([1,2,3], 3, 'array has length of 3');
     *     lengthOf('foobar', 6, 'string has length of 6');
     *
     * @param {*} object
     * @param {*} length
     * @param {string} successMessage
     */

    lengthOf(object, length, successMessage = '') {}

    /**
     * ### .throws(function, [constructor/string/regexp], [string/regexp], [successMessage])
     *
     * Asserts that `function` will throw an error that is an instance of
     * `constructor`, or alternately that it will throw an error with message
     * matching `regexp`.
     *
     *     throws(fn, 'function throws a reference error');
     *     throws(fn, /function throws a reference error/);
     *     throws(fn, ReferenceError);
     *     throws(fn, ReferenceError, 'function throws a reference error');
     *     throws(fn, ReferenceError, /function throws a reference error/);
     *
     * @param {*} function
     * @param {*} constructor
     * @param {*} regexp
     * @param {string} successMessage
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error#Error_types
     */


    /**
     * ### .operator(value1, operator, value2, [successMessage])
     *
     * Compares two values using `operator`.
     *
     *     operator(1, '<', 2, 'everything is ok');
     *     operator(1, '>', 2, 'this will fail');
     *
     * @param {*} value1
     * @param {string} operator
     * @param {*} value2
     * @param {string} successMessage
     */

    operator(value1, operator, value2, successMessage = '') {}

    /**
     * ### .closeTo(actual, expected, delta, [successMessage])
     *
     * Asserts that the target is equal `expected`, to within a +/- `delta` range.
     *
     *     closeTo(1.5, 1, 0.5, 'numbers are close');
     *
     * @param {*} actual
     * @param {*} expected
     * @param {*} delta
     * @param {string} successMessage
     */

    closeTo(actual, expected, delta, successMessage = '') {}

    /**
     * ### .approximately(actual, expected, delta, [successMessage])
     *
     * Asserts that the target is equal `expected`, to within a +/- `delta` range.
     *
     *     approximately(1.5, 1, 0.5, 'numbers are close');
     *
     * @param {*} actual
     * @param {*} expected
     * @param {*} delta
     * @param {string} successMessage
     */

    approximately(actual, expected, delta, successMessage = '') {}

    /**
     * ### .sameMembers(set1, set2, [successMessage])
     *
     * Asserts that `set1` and `set2` have the same members.
     * Order is not taken into account.
     *
     *     sameMembers([ 1, 2, 3 ], [ 2, 1, 3 ], 'same members');
     *
     * @param {*} set1
     * @param {*} set2
     * @param {string} successMessage
     */

    sameMembers(set1, set2, successMessage = '') {}

    /**
     * ### .sameDeepMembers(set1, set2, [successMessage])
     *
     * Asserts that `set1` and `set2` have the same members - using a deep equality checking.
     * Order is not taken into account.
     *
     *     sameDeepMembers([ {}, {}, {} ], [ {}, {}, {} ], 'same deep members');
     *
     * @param {*} set1
     * @param {*} set2
     * @param {string} successMessage
     */

    sameDeepMembers(set1, set2, successMessage = '') {}

    /**
     * ### .includeMembers(superset, subset, [successMessage])
     *
     * Asserts that `subset` is included in `superset`.
     * Order is not taken into account.
     *
     *     includeMembers([ 1, 2, 3 ], [ 2, 1 ], 'include members');
     *
     * @param {*} superset
     * @param {*} subset
     * @param {string} successMessage
     */

    includeMembers(superset, subset, successMessage = '') {}

    /**
     * Asserts that subset isn’t included in superset in any order.
     * Uses a strict equality check (===). Duplicates are ignored.
     *
     *     notIncludeMembers([ 1, 2, 3 ], [ 5, 1 ], 'not include members');
     *
     * @param {Array} superset
     * @param {Array} subset
     * @param {String} successMessage
     */
    notIncludeMembers(superset, subset, successMessage = '') {}

    /**
     * ### .includeDeepMembers(superset, subset, [successMessage])
     *
     * Asserts that `subset` is included in `superset` - using deep equality checking.
     * Order is not taken into account.
     * Duplicates are ignored.
     *
     *     includeDeepMembers([ {}, {}, {} ], [ {}, {}, {} ], 'include deep members');
     *
     * @param {*} superset
     * @param {*} subset
     * @param {string} successMessage
     */


    includeDeepMembers(superset, subset, successMessage = '') {}

    /**
     * ### .oneOf(inList, list, [successMessage])
     *
     * Asserts that non-object, non-array value `inList` appears in the flat array `list`.
     *
     *     oneOf(1, [ 2, 1 ], 'Not found in list');
     *
     * @param {*} inList
     * @param {*} list
     * @param {string} successMessage
     */

    oneOf(inList, list, successMessage = '') {}


    /**
     * ### .ifError(object)
     *
     * Asserts if value is not a false value, and throws if it is a true value.
     * This is added to allow for chai to be a drop-in replacement for Node's
     * assert class.
     *
     *     var err = new Error('I am a custom error');
     *     ifError(err); // Rethrows err!
     *
     * @param {*} object
     */

    ifError(val) {}

    /**
     * ### .isExtensible(object)
     *
     * Asserts that `object` is extensible (can have new properties added to it).
     *
     *     isExtensible({});
     *
     * @param {*} object
     * @param {string} successMessage _optional_
     */

    isExtensible(object, successMessage = '') {}

    /**
     * ### .isNotExtensible(object)
     *
     * Asserts that `object` is _not_ extensible.
     *
     *     var nonExtensibleObject = Object.preventExtensions({});
     *     var sealedObject = Object.seal({});
     *     var frozenObject = Object.freese({});
     *
     *     isNotExtensible(nonExtensibleObject);
     *     isNotExtensible(sealedObject);
     *     isNotExtensible(frozenObject);
     *
     * @param {*} object
     * @param {string} successMessage _optional_
     */

    isNotExtensible(object, successMessage = '') {}

    /**
     * ### .isSealed(object)
     *
     * Asserts that `object` is sealed (cannot have new properties added to it
     * and its existing properties cannot be removed).
     *
     *     var sealedObject = Object.seal({});
     *     var frozenObject = Object.seal({});
     *
     *     isSealed(sealedObject);
     *     isSealed(frozenObject);
     *
     * @param {*} object
     * @param {string} successMessage _optional_
     */

    isSealed(object, successMessage = '') {}

    /**
     * ### .isNotSealed(object)
     *
     * Asserts that `object` is _not_ sealed.
     *
     *     isNotSealed({});
     *
     * @param {*} object
     * @param {string} successMessage _optional_
     */

    isNotSealed(object, successMessage = '') {}

    /**
     * ### .isFrozen(object)
     *
     * Asserts that `object` is frozen (cannot have new properties added to it
     * and its existing properties cannot be modified).
     *
     *     var frozenObject = Object.freeze({});
     *     frozen(frozenObject);
     *
     * @param {*} object
     * @param {string} successMessage _optional_
     */

    isFrozen(object, successMessage = '') {}

    /**
     * ### .isNotFrozen(object)
     *
     * Asserts that `object` is _not_ frozen.
     *
     *     isNotFrozen({});
     *
     * @param {*} object
     * @param {string} successMessage _optional_
     */

    isNotFrozen(object, successMessage = '') {}

    /**
     * Asserts that value is a finite number. Unlike .isNumber, this will fail for NaN and Infinity.
     *
     * @param value
     * @param successMessage
     */
    isFinite(value, successMessage = '') {}

    /**
     * Asserts that haystack includes needle. Can be used to assert the inclusion of a value in
     * an array or a subset of properties in an object. Deep equality is used.
     *
     * @param haystack
     * @param needle
     * @param successMessage
     */
    deepInclude(haystack, needle, successMessage = '') {}

    /**
     * Asserts that haystack does not include needle. Can be used to assert the absence of a value in
     * an array or a subset of properties in an object. Deep equality is used
     *
     * @param haystack
     * @param needle
     * @param successMessage
     */
    notDeepInclude(haystack, needle, successMessage = '') {}

    /**
     * Asserts that ‘haystack’ includes ‘needle’. Can be used to assert the inclusion of a subset of properties
     * in an object. Enables the use of dot- and bracket-notation for referencing nested properties.
     * ‘[]’ and ‘.’ in property names can be escaped using double backslashes
     *
     * @param haystack
     * @param needle
     * @param successMessage
     */
    nestedInclude(haystack, needle, successMessage = '') {}

    /**
     * Asserts that ‘haystack’ does not include ‘needle’. Can be used to assert the absence of a subset of properties
     * in an object. Enables the use of dot- and bracket-notation for referencing nested properties.
     * ‘[]’ and ‘.’ in property names can be escaped using double backslashes
     *
     * @param haystack
     * @param needle
     * @param successMessage
     */
    notNestedInclude(haystack, needle, successMessage = '') {}

    /**
     * Asserts that ‘haystack’ includes ‘needle’. Can be used to assert the inclusion of a subset of properties in
     * an object while checking for deep equality. Enables the use of dot- and bracket-notation for
     * referencing nested properties. ‘[]’ and ‘.’ in property names can be escaped using double backslashes
     *
     * @param haystack
     * @param needle
     * @param successMessage
     */
    deepNestedInclude(haystack, needle, successMessage = '') {}

    /**
     * Asserts that ‘haystack’ does not include ‘needle’. Can be used to assert the absence of a subset of properties
     * in an object while checking for deep equality. Enables the use of dot- and bracket-notation for referencing
     * nested properties. ‘[]’ and ‘.’ in property names can be escaped using double backslashes
     *
     * @param haystack
     * @param needle
     * @param successMessage
     */
    notDeepNestedInclude(haystack, needle, successMessage = '') {}

    /**
     * Asserts that ‘haystack’ includes ‘needle’. Can be used to assert the inclusion of a subset of properties
     * in an object while ignoring inherited properties
     *
     * @param haystack
     * @param needle
     * @param successMessage
     */
    ownInclude(haystack, needle, successMessage = '') {}

    /**
     * Asserts that ‘haystack’ not includes ‘needle’. Can be used to assert the absence of a subset of properties
     * in an object while ignoring inherited properties.
     *
     * @param haystack
     * @param needle
     * @param successMessage
     */
    notOwnInclude(haystack, needle, successMessage = '') {}

    /**
     * Asserts that ‘haystack’ includes ‘needle’. Can be used to assert the inclusion of a subset of properties
     * in an object while ignoring inherited properties and checking for deep equality
     *
     * @param haystack
     * @param needle
     * @param successMessage
     */
    deepOwnInclude(haystack, needle, successMessage = '') {}

    /**
     * Asserts that ‘haystack’ includes ‘needle’. Can be used to assert the absence of a subset of properties
     * in an object while ignoring inherited properties and checking for deep equality
     *
     * @param haystack
     * @param needle
     * @param successMessage
     */
    notDeepOwnInclude(haystack, needle, successMessage = '') {}

    /**
     * Asserts that object has a direct or inherited property named by property, which can be a string using
     * dot- and bracket-notation for nested reference
     *
     * @param object
     * @param property
     * @param successMessage
     */
    nestedProperty(object, property, successMessage = '') {}

    /**
     * Asserts that object does not have a property named by property, which can be a string using
     * dot- and bracket-notation for nested reference.
     * The property cannot exist on the object nor anywhere in its prototype chain.
     *
     * @param object
     * @param property
     * @param successMessage
     */
    notNestedProperty(object, property, successMessage = '') {}

    /**
     * Asserts that object has a property named by property with value given by value. property can use dot-
     * and bracket-notation for nested reference. Uses a strict equality check (===).
     *
     * @param object
     * @param property
     * @param value
     * @param successMessage
     */
    nestedPropertyVal(object, property, value, successMessage = '') {}

    /**
     * Asserts that object does not have a property named by property with value given by value. property can use
     * dot- and bracket-notation for nested reference. Uses a strict equality check (===).
     *
     * @param object
     * @param property
     * @param value
     * @param successMessage
     */
    notNestedPropertyVal(object, property, value, successMessage = '') {}

    /**
     * Asserts that object has a property named by property with a value given by value. property can use
     * dot- and bracket-notation for nested reference. Uses a deep equality check.
     *
     * @param object
     * @param property
     * @param value
     * @param successMessage
     */
    deepNestedPropertyVal(object, property, value, successMessage = '') {}

    /**
     * Asserts that object does not have a property named by property with value given by value. property can
     * use dot- and bracket-notation for nested reference. Uses a deep equality check.
     *
     * @param object
     * @param property
     * @param value
     * @param successMessage
     */
    notDeepNestedPropertyVal(object, property, value, successMessage = '') {}

    /**
     * Asserts that object has at least one of the keys provided. You can also provide a single object instead of
     * a keys array and its keys will be used as the expected set of keys.
     *
     * @param object
     * @param keys
     * @param successMessage
     */
    hasAnyKeys(object, keys, successMessage = '') {}

    /**
     * Asserts that object has all and only all of the keys provided. You can also provide a single object instead
     * of a keys array and its keys will be used as the expected set of keys.
     *
     * @param object
     * @param keys
     * @param successMessage
     */
    hasAllKeys(object, keys, successMessage = '') {}

    /**
     * Asserts that object has all of the keys provided but may have more keys not listed. You can also provide a
     * single object instead of a keys array and its keys will be used as the expected set of keys.
     *
     * @param object
     * @param keys
     * @param successMessage
     */
    containsAllKeys(object, keys, successMessage = '') {}

    /**
     * Asserts that `object` has none of the `keys` provided.
     * You can also provide a single object instead of a `keys` array and its keys
     * will be used as the expected set of keys.
     *
     * @param object
     * @param keys
     * @param successMessage
     */
    doesNotHaveAnyKeys(object, keys, successMessage = '') {}

    /**
     * Asserts that `object` does not have at least one of the `keys` provided.
     * You can also provide a single object instead of a `keys` array and its keys
     * will be used as the expected set of keys.
     *
     * @param object
     * @param keys
     * @param successMessage
     */
    doesNotHaveAllKeys(object, keys, successMessage = '') {}

    /**
     * Asserts that object has at least one of the keys provided. Since Sets and Maps can have objects as keys
     * you can use this assertion to perform a deep comparison. You can also provide a single object
     * instead of a keys array and its keys will be used as the expected set of keys
     *
     * @param object
     * @param keys
     * @param successMessage
     */
    hasAnyDeepKeys(object, keys, successMessage = '') {}

    hasAllDeepKeys(object, keys, successMessage = '') {}

    containsAllDeepKeys(object, keys, successMessage = '') {}

    doesNotHaveAnyDeepKeys(object, keys, successMessage = '') {}

    doesNotHaveAllDeepKeys(object, keys, successMessage = '') {}

    throws(fn, errorLike, string, successMessage = '') {}

    doesNotThrow(fn, errorLike, string, successMessage = '') {}

    notSameMembers(set1, set2, successMessage = '') {}

    notSameDeepMembers(set1, set2, successMessage = '') {}

    sameOrderedMembers(set1, set2, successMessage = '') {}

    notSameOrderedMembers(set1, set2, successMessage = '') {}

    sameDeepOrderedMembers(set1, set2, successMessage = '') {}

    notSameDeepOrderedMembers(set1, set2, successMessage = '') {}

    notIncludeDeepMembers(superset, subset, successMessage = '') {}

    includeOrderedMembers(superset, subset, successMessage = '') {}

    notIncludeOrderedMembers(superset, subset, successMessage = '') {}

    includeDeepOrderedMembers(superset, subset, successMessage = '') {}

    notIncludeDeepOrderedMembers(superset, subset, successMessage = '') {}

    changes(fn, object, property, successMessage = '') {}

    changesBy(fn, object, property, delta, successMessage = '') {}

    doesNotChange(fn, object, property, successMessage = '') {}

    changesButNotBy(fn, object, property, delta, successMessage = '') {}

    increases(fn, object, property, successMessage = '') {}

    increasesBy(fn, object, property, delta, successMessage = '') {}

    doesNotIncrease(fn, object, property, successMessage = '') {}

    increasesButNotBy(fn, object, property, delta, successMessage = '') {}

    decreases(fn, object, property, successMessage = '') {}

    decreasesBy(fn, object, property, delta, successMessage = '') {}

    doesNotDecrease(fn, object, property, successMessage = '') {}

    doesNotDecreaseBy(fn, object, property, delta, successMessage = '') {}

    decreasesButNotBy(fn, object, property, delta, successMessage = '') {}

    isNotEmpty(target) {}

}
