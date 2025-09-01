/// <reference types="mocha" />

import * as chai from 'chai';
import {getFormattedString} from '../src/utils';

describe('utils', () => {
    it('should return the "UNKNOWN_OBJECT" if all serialize methods are overloaded', () => {
        const object = {
            toFormattedString: undefined,
            toString: null,
        };

        chai.expect(getFormattedString(object)).to.equal('UNKNOWN_OBJECT');
    });

    it('should return the "undefined" if undefined is passed', () => {
        chai.expect(getFormattedString(undefined)).to.equal('undefined');
    });

    it('should return the "null" if null is passed', () => {
        chai.expect(getFormattedString(null)).to.equal('null');
    });

    it('should return the same string if Symbol is passed', () => {
        const symbol = Symbol('@symbol');

        chai.expect(getFormattedString(symbol)).to.equal('Symbol(@symbol)');
    });

    it('should return [object Object] if called from Object', () => {
        chai.expect(getFormattedString({})).to.equal('[object Object]');
    });

    it('should return empty string if called from empty Array', () => {
        chai.expect(getFormattedString([])).to.equal('');
    });

    it('should return concatenated string if called from Array', () => {
        chai.expect(getFormattedString([1, 2, 3])).to.equal('1,2,3');
    });

    it('should return toString method call result', () => {
        class Dummy {
            private value: string;

            constructor(value: string) {
                this.value = value;
            }

            toString() {
                return this.value;
            }
        }

        chai.expect(getFormattedString(new Dummy('foo'))).to.equal('foo');
    });

    it('should return toString property call result', () => {
        const object = {
            toString: () => 'bar',
        };

        chai.expect(getFormattedString(object)).to.equal('bar');
    });

    it('should return toFormattedString method call result', () => {
        class Dummy {
            private value: string;

            constructor(value: string) {
                this.value = value;
            }

            toFormattedString() {
                return `formatted ${this.value}`;
            }

            toString() {
                return this.value;
            }
        }

        chai.expect(getFormattedString(new Dummy('foo'))).to.equal(
            'formatted foo',
        );
    });

    it('should return toFormattedString property call result', () => {
        const object = {
            value: 'bar',

            toFormattedString() {
                return `formatted ${this.value}`;
            },

            toString: () => 'test',
        };

        chai.expect(getFormattedString(object)).to.equal('formatted bar');
    });
});
