import * as chai from 'chai';
import {IAssertionOptions} from '@testring/types';
import {PromisedAssert} from './promisedAssert';

const errorMessagesField = '_errorMessages';
type AssertionAPI = typeof chai['assert'] & {
    [errorMessagesField]: Array<string>;
};
type WrappedPromisedAssertionApi = PromisedAssert & {
    [errorMessagesField]: Array<string>;
} & AssertionAPI;

export function createAssertion(options: IAssertionOptions = {}) {
    const isSoft = options.isSoft === true;
    for (const plugin of options.plugins || []) {
        chai.use(plugin);
    }
    // eslint-disable-next-line sonarjs/cognitive-complexity
    const proxyGetter = (target: AssertionAPI, fieldName: string) => {
        if (fieldName === errorMessagesField) {
            return target[errorMessagesField];
        }

        const typeOfAssert = isSoft ? 'softAssert' : 'assert';

        const originalMethod = (chai.assert as any)[fieldName];
        const methodAsString = (target as any)[fieldName]
            .toString()
            .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm, '');
        const stringStart = methodAsString.indexOf('(') + 1;
        const stringEnd = methodAsString.indexOf(')');
        const methodArgs =
            methodAsString.slice(stringStart, stringEnd).match(/([^\s,]+)/g) ||
            [];

        return async (...args: any[]) => {
            const successMessage =
                originalMethod.length === args.length ? args.pop() : '';
            const assertArguments: Array<any> = [];

            let assertMessage = `[${typeOfAssert}] ${fieldName}`;

            for (let index = 0; index < methodArgs.length; index++) {
                if (index === args.length) {
                    break;
                }

                const replacer = (_k: any, v: any) =>
                    Object.prototype.toString.call(v) === '[object RegExp]'
                        ? v.toString()
                        : v;
                const argsString =
                    typeof args[index] !== 'undefined'
                        ? JSON.stringify(args[index], replacer)
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
                const errorMessage = (error as Error).message;
                let handleError: void | Error | null = null;

                (error as Error).message = successMessage || assertMessage || errorMessage;

                if (options.onError) {
                    handleError = await options.onError({
                        isSoft,
                        successMessage,
                        assertMessage,
                        errorMessage,
                        error: (error instanceof Error) ? error : new Error(String(error)),
                        args,
                        originalMethod: fieldName,
                    });
                }

                if (!handleError) {
                    handleError = error as Error;
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
