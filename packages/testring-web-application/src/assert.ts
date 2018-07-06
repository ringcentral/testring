import * as chai from 'chai';
import { loggerClient } from '@testring/logger';

type RootType = typeof chai.assert & { errorMessages: Array<any> };

export const createAssertion = (isSoft = false) => {
    const root: RootType = Object.assign({}, chai.assert, {
        errorMessages: []
    });

    return new Proxy(root, {
        get(target, fieldName: string) {
            if (fieldName === 'errorMessages') {
                return target.errorMessages;
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

                let assertMessage = `${typeOfAssert}.${fieldName}`;

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
                        target.errorMessages.push(successMessage || assertMessage || error.message);
                    } else {
                        error.message = (successMessage || assertMessage || error.message);

                        throw error;
                    }
                }
            };
        }
    });
};
