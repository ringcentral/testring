/// <reference types="mocha" />

import * as chai from 'chai';
import { logXpath } from '../src/utils';

describe('utils', () => {
    it('should throw error if called without arguments', () => {
       const catcher = () => logXpath(undefined);

       chai.expect(catcher).to.throw(Error);
    });


    it('should return the same object if null is passed', () => {
        chai.expect(logXpath(null)).to.equal(null);
    });


    it('should return the same string if Symbol is passed', () => {
        const symbol = Symbol('@symbol');

        chai.expect(logXpath(symbol)).to.equal('Symbol(@symbol)');
    });


    it('should return [object Object] if called from Object', () => {
        chai.expect(logXpath({})).to.equal('[object Object]');
    });


    it('should return empty string if called from empty Array', () => {
        chai.expect(logXpath([])).to.equal('');
    });


    it('should return concatenated string if called from Array', () => {
        chai.expect(logXpath([1,2,3])).to.equal('1,2,3');
    });


    it('should return toString method call result', () => {
        class Dummy {
            constructor(private value: string) {
            }

            toString() {
                return this.value;
            }
        }

        chai.expect(logXpath(new Dummy('foo'))).to.equal('foo');
    });


    it('should return toString property call result', () => {
        const object = {
            toString: () => 'bar',
        };

        chai.expect(logXpath(object)).to.equal('bar');
    });


    it('should return toFormattedString method call result', () => {
        class Dummy {
            constructor(private value: string) {
            }

            toFormattedString() {
                return `formatted ${this.value}`;
            }

            toString() {
                return this.value;
            }
        }

        chai.expect(logXpath(new Dummy('foo'))).to.equal('formatted foo');
    });


    it('should return toFormattedString property call result', () => {
        const object = {
            value: 'bar',

            toFormattedString() {
                return `formatted ${this.value}`;
            },

            toString: () => 'test',
        };

        chai.expect(logXpath(object)).to.equal('formatted bar');
    });
});
