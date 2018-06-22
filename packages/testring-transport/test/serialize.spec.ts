/// <reference types="node" />
/// <reference types="mocha" />

import * as chai from 'chai';
import { serialize, deserialize } from '../src/serialize';

describe('serialize', () => {
    it('should serialize array without data loss', () => {
        const data = [
            0, 1,
            'string',
            null,
            undefined,
            NaN,
            {
                array: [ null, 'another string', 2 ],
            }
        ];
        const serializedData = serialize(data);
        const deserializedData = deserialize(serializedData);

        chai.expect(deserializedData).to.be.deep.equal(data);
    });

    it('should serialize error', () => {
        const error = new TypeError('test');

        const serializedError = serialize(error);
        const deserializedError = deserialize(serializedError);

        chai.expect(deserializedError.name).to.be.equal(error.name);
        chai.expect(deserializedError.message).to.be.equal(error.message);
        chai.expect(deserializedError.stack).to.be.equal(error.stack);
    });

    it('should serialize arrow function', () => {
        const arrowFunction = (a, b) => {
            return a + b + 2;
        };

        const serializedFunction = serialize(arrowFunction);
        const deserializedFunction = deserialize(serializedFunction);

        chai.expect(deserializedFunction).to.be.a('function');
        chai.expect(deserializedFunction.length).to.be.equal(2);

        const callResult = deserializedFunction(1, 3);

        chai.expect(callResult).to.be.equal(6);
    });

    it('should serialize anonymous function', () => {
        const anonymousFunction = function(a, b) {
            return a + b + 2;
        };

        const serializedFunction = serialize(anonymousFunction);
        const deserializedFunction = deserialize(serializedFunction);

        chai.expect(deserializedFunction).to.be.a('function');
        chai.expect(deserializedFunction.length).to.be.equal(2);

        const callResult = deserializedFunction(1, 3);

        chai.expect(callResult).to.be.equal(6);
    });

    it('should serialize named function', () => {
        function namedFunction(a, b) {
            return a + b + 2;
        }

        const serializedFunction = serialize(namedFunction);
        const deserializedFunction = deserialize(serializedFunction);

        chai.expect(deserializedFunction).to.be.a('function');
        chai.expect(deserializedFunction.length).to.be.equal(2);

        const callResult = deserializedFunction(1, 3);

        chai.expect(callResult).to.be.equal(6);
    });
});
