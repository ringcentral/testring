/// <reference types="mocha" />

import * as chai from 'chai';
import {serialize, deserialize} from '../src/serialize';

describe('serialize', () => {
    const roundTrip = (value: any) => deserialize(serialize(value));

    it('should preserve every byte and an empty buffer', () => {
        const bytes = Buffer.from(Array.from({length: 256}, (_, index) => index));

        chai.expect(roundTrip(bytes)).to.deep.equal(bytes);
        chai.expect(roundTrip(Buffer.alloc(0))).to.deep.equal(Buffer.alloc(0));
    });

    it('should preserve JSON-unsafe scalar values and bigint', () => {
        const values = [
            undefined,
            NaN,
            Infinity,
            -Infinity,
            -0,
            BigInt('0'),
            BigInt('9007199254740993'),
        ];
        const result = roundTrip(values);

        values.forEach((value, index) => {
            chai.expect(Object.is(result[index], value)).to.equal(true);
        });
    });

    it('should serialize repeated references without marking them circular', () => {
        const repeated = {value: 1};

        chai.expect(roundTrip([repeated, repeated])).to.deep.equal([
            {value: 1},
            {value: 1},
        ]);
    });

    it('should include only own enumerable string keys', () => {
        const inherited = {inherited: true};
        const value = Object.assign(Object.create(inherited), {own: true});

        chai.expect(roundTrip(value)).to.deep.equal({own: true});

        const symbol = Symbol('diagnostic');
        Object.defineProperty(value, symbol, {value: true, enumerable: true});
        chai.expect(() => serialize(value)).to.throw(TypeError);
    });

    it('should reject unsupported payload values explicitly', () => {
        for (const value of [Symbol('value'), new Map(), /value/]) {
            chai.expect(() => serialize(value)).to.throw(TypeError);
        }
    });

    it('should serialize array without data loss', () => {
        const data = [
            0,
            1,
            'string',
            null,
            undefined,
            NaN,
            {
                array: [null, 'another string', 2],
            },
        ];
        const serializedData = serialize(data);
        const deserializedData = deserialize(serializedData);

        chai.expect(deserializedData).to.be.deep.equal(data);
    });

    it('should serialize error', () => {
        const errorTypes = [
            'EvalError',
            'RangeError',
            'ReferenceError',
            'SyntaxError',
            'TypeError',
            'URIError',
        ];

        for (const errorType of errorTypes) {
            const error = new (global as Record<string, any>)[errorType]('test');

            const serializedError = serialize(error);
            const deserializedError = deserialize(serializedError);

            chai.expect(deserializedError.name).to.be.equal(error.name);
            chai.expect(deserializedError.message).to.be.equal(error.message);
            chai.expect(deserializedError.stack).to.be.equal(error.stack);
        }
    });

    it('should serialize custom error', () => {
        class CustomError extends Error {}

        const error = new CustomError('test');

        const serializedError = serialize(error);
        const deserializedError = deserialize(serializedError);

        chai.expect(deserializedError.name).to.be.equal('Error');
        chai.expect(deserializedError.message).to.be.equal(error.message);
        chai.expect(deserializedError.stack).to.be.equal(error.stack);
    });

    it('should preserve recursive error diagnostics without inherited fields', () => {
        const cause = new TypeError('cause');
        const prototype = {inherited: 'omit'};
        const error = Object.assign(new Error('primary'), {
            cleanupErrors: [cause],
            detail: {value: 1},
        });
        Object.defineProperty(error, 'cause', {value: cause});
        Object.setPrototypeOf(error, Object.assign(Object.create(Error.prototype), prototype));

        const result = roundTrip(error) as Error & Record<string, any>;

        chai.expect(result.name).to.equal(error.name);
        chai.expect(result.message).to.equal(error.message);
        chai.expect(result.stack).to.equal(error.stack);
        chai.expect(result['cause']).to.be.instanceOf(TypeError);
        chai.expect(result['cause'].message).to.equal('cause');
        chai.expect(result['cleanupErrors'][0]).to.be.instanceOf(TypeError);
        chai.expect(result['detail']).to.deep.equal({value: 1});
        chai.expect(result).not.to.have.own.property('inherited');
    });

    it('should preserve URL values directly and when nested', () => {
        const value = {
            direct: new URL('https://user:pass@example.test:8443/path?a=1#part'),
            nested: [{url: new URL('https://example.test/nested')}],
        };

        const result = roundTrip(value) as any;

        chai.expect(result.direct).to.be.instanceOf(URL);
        chai.expect(result.direct.href).to.equal(value.direct.href);
        chai.expect(result.nested[0].url).to.be.instanceOf(URL);
        chai.expect(result.nested[0]!.url.href).to.equal(value.nested[0]!.url.href);
    });

    it('should preserve enumerable URL error properties and diagnostics', () => {
        const cause = new TypeError('cause');
        const error = Object.assign(new Error('primary'), {
            url: new URL('https://example.test/failure?case=1#fragment'),
            detail: {urls: [new URL('https://example.test/nested')]},
        });
        Object.defineProperty(error, 'cause', {value: cause});

        const result = roundTrip(error) as Error & Record<string, any>;

        chai.expect(result).to.be.instanceOf(Error);
        chai.expect(result.name).to.equal(error.name);
        chai.expect(result.message).to.equal(error.message);
        chai.expect(result.stack).to.equal(error.stack);
        chai.expect(result['cause']).to.be.instanceOf(TypeError);
        chai.expect(result['url']).to.be.instanceOf(URL);
        chai.expect(result['url'].href).to.equal(error.url.href);
        chai.expect(result['detail']['urls'][0]).to.be.instanceOf(URL);
        chai.expect(result['detail']['urls'][0]!.href).to.equal(error.detail.urls[0]!.href);
    });

    it('should preserve a sample of URL-bearing errors', () => {
        for (let index = 0; index < 10; index++) {
            const error = Object.assign(new Error(`failure-${index}`), {
                url: new URL(`https://example.test/failure/${index}`),
            });

            const result = roundTrip(error) as Error & Record<string, any>;

            chai.expect(result.message).to.equal(error.message);
            chai.expect(result['url'].href).to.equal(error.url.href);
        }
    });

    it('should serialize arrow function', () => {
        const arrowFunction = (a: any, b: any) => {
            return a + b + 2;
        };

        const serializedFunction = serialize(arrowFunction);
        const deserializedFunction = deserialize(serializedFunction);

        chai.expect(deserializedFunction).to.be.a('function');
        chai.expect(deserializedFunction.length).to.be.equal(2);

        const callResult = deserializedFunction(1, 3);

        chai.expect(callResult).to.be.equal(6);
    });

    it('should serialize arrow function with zero arguments', () => {
        const arrowFunction = () => 2;

        const serializedFunction = serialize(arrowFunction);
        const deserializedFunction = deserialize(serializedFunction);

        chai.expect(deserializedFunction).to.be.a('function');
        chai.expect(deserializedFunction.length).to.be.equal(0);

        const callResult = deserializedFunction(1);

        chai.expect(callResult).to.be.equal(2);
    });

    it('should serialize arrow function without body', () => {
        const arrowFunction = (a: number) => a + 2;

        const serializedFunction = serialize(arrowFunction);
        const deserializedFunction = deserialize(serializedFunction);

        chai.expect(deserializedFunction).to.be.a('function');
        chai.expect(deserializedFunction.length).to.be.equal(1);

        const callResult = deserializedFunction(1);

        chai.expect(callResult).to.be.equal(3);
    });

    it('should serialize anonymous function', () => {
        const anonymousFunction = (a: any, b: any) => {
            return a + b + 2;
        };

        const serializedFunction = serialize(anonymousFunction);
        const deserializedFunction = deserialize(serializedFunction);

        chai.expect(deserializedFunction).to.be.a('function');
        chai.expect(deserializedFunction.length).to.be.equal(2);

        const callResult = deserializedFunction(1, 3);

        chai.expect(callResult).to.be.equal(6);
    });

    it('should serialize anonymous function without arguments', () => {
        const anonymousFunction = () => {
            return 2;
        };

        const serializedFunction = serialize(anonymousFunction);
        const deserializedFunction = deserialize(serializedFunction);

        chai.expect(deserializedFunction).to.be.a('function');
        chai.expect(deserializedFunction.length).to.be.equal(0);

        const callResult = deserializedFunction();

        chai.expect(callResult).to.be.equal(2);
    });

    it('should serialize named function', () => {
        function namedFunction(a: any, b: any) {
            return a + b + 2;
        }

        const serializedFunction = serialize(namedFunction);
        const deserializedFunction = deserialize(serializedFunction);

        chai.expect(deserializedFunction).to.be.a('function');
        chai.expect(deserializedFunction.length).to.be.equal(2);

        const callResult = deserializedFunction(1, 3);

        chai.expect(callResult).to.be.equal(6);
    });

    it('should serialize objects with circular links', () => {
        const obj1: any = {};
        const obj2: any = {};

        obj1.a = obj1;
        obj1.b = obj2;
        obj2.a = obj1;
        obj2.b = obj2;

        const serializedFunction = serialize(obj1);
        const deserializedFunction = deserialize(serializedFunction);

        chai.expect(deserializedFunction).to.be.deep.equal({
            a: '(Circular)',
            b: {
                a: '(Circular)',
                b: '(Circular)',
            },
        });
    });
});
