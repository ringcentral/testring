import * as chai from 'chai';
import {IAssertionOptions} from '@testring/types';
import {PromisedAssert} from './promisedAssert';

const errorMessagesField = '_errorMessages';
type AssertionAPI = typeof chai['assert'] & {
    [errorMessagesField]: Array<string>;
};
type WrappedPromisedAssertionApi = PromisedAssert & {
    [errorMessagesField]: Array<string>;
};

export function createAssertion(options: IAssertionOptions = {}) {
    const isSoft = options.isSoft === true;
    // eslint-disable-next-line sonarjs/cognitive-complexity
    const proxyGetter = (target, fieldName: string) => {
        if (fieldName === errorMessagesField) {
            return target[errorMessagesField];
        }

        const typeOfAssert = isSoft ? 'softAssert' : 'assert';

        const originalMethod = chai.assert[fieldName];
        const methodAsString = target[fieldName]
            .toString()
            .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm, '');
        const stringStart = methodAsString.indexOf('(') + 1;
        const stringEnd = methodAsString.indexOf(')');
        const methodArgs =
            methodAsString.slice(stringStart, stringEnd).match(/([^\s,]+)/g) ||
            [];

        return async (...args) => {
            const successMessage =
                originalMethod.length === args.length ? args.pop() : '';
            const assertArguments: Array<any> = [];

            let assertMessage = `[${typeOfAssert}] ${fieldName}`;

            for (let index = 0; index < methodArgs.length; index++) {
                if (index === args.length) {
                    break;
                }

                const argsString =
                    typeof args[index] !== 'undefined'
                        ? JSON.stringify(args[index])
                        : 'undefined';

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
                        args,
                        originalMethod: fieldName,
                    });
                }
            } catch (error) {
                const errorMessage = error.message;
                let handleError: void | Error;

                error.message = successMessage || assertMessage || errorMessage;

                if (options.onError) {
                    handleError = await options.onError({
                        isSoft,
                        successMessage,
                        assertMessage,
                        errorMessage,
                        error,
                        args,
                        originalMethod: fieldName,
                    });
                }

                if (!handleError) {
                    handleError = error;
                }

                if (isSoft) {
                    target[errorMessagesField].push(
                        (handleError as Error).message,
                    );
                } else {
                    throw handleError;
                }
            }
        };
    };

    const root: AssertionAPI = Object.assign({}, chai.assert, {
        [errorMessagesField]: [],
    });

    return new Proxy<WrappedPromisedAssertionApi>(root as any, {
        get: proxyGetter,
    });
}
