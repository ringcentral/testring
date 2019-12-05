import * as chai from 'chai';
import { IAssertionOptions } from '@testring/types';

type AssertionAPI = typeof chai['assert'] & { _errorMessages: Array<any> };

export function createAssertion(options: IAssertionOptions = {}) {
    const root: AssertionAPI = Object.assign({}, chai.assert, {
        _errorMessages: [],
    });
    const isSoft = options.isSoft === true;

    return new Proxy<AssertionAPI>(root, {
        get(target, fieldName: string) {
            if (fieldName === '_errorMessages') {
                return target._errorMessages;
            }

            const typeOfAssert = isSoft ? 'softAssert' : 'assert';

            const originalMethod = chai.assert[fieldName];
            const methodAsString = target[fieldName].toString().replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg, '');
            const stringStart = methodAsString.indexOf('(') + 1;
            const stringEnd = methodAsString.indexOf(')');
            const methodArgs = methodAsString.slice(stringStart, stringEnd).match(/([^\s,]+)/g) || [];

            return async (...args) => {
                const successMessage = originalMethod.length === args.length ? args.pop() : '';
                const assertArguments: Array<any> = [];

                let assertMessage = `[${typeOfAssert}] ${fieldName}`;

                for (let index = 0; index < methodArgs.length; index++) {
                    if (index === args.length) {
                        break;
                    }

                    const argsString = typeof args[index] !== 'undefined' ?
                        JSON.stringify(args[index]) :
                        'undefined';

                    assertArguments.push(methodArgs[index] + ' = ' + argsString);
                }

                assertMessage += `(${assertArguments.join(', ')})`;

                try {
                    originalMethod(...args);

                    if (options.onSuccess) {
                        await options.onSuccess({
                            isSoft,
                            successMessage,
                            assertMessage,
                            originalMethod: fieldName,
                        });
                    }

                } catch (error) {
                    const errorMessage = error.message;
                    error.message = (successMessage || assertMessage || errorMessage);

                    if (options.onError) {
                        await options.onError({
                            isSoft,
                            successMessage,
                            assertMessage,
                            errorMessage,
                            error,
                            originalMethod: fieldName,
                        });
                    }

                    if (isSoft) {
                        target._errorMessages.push(error.message);
                    } else {
                        throw error;
                    }
                }
            };
        },
    });
}
