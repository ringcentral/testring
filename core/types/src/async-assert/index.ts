import type {use as chaiUse} from 'chai';

type First<T> = T extends [infer A, ...any[]] ? A : never;
type ChaiPlugin = First<Parameters<typeof chaiUse>>;

export interface IAssertionSuccessMeta {
    isSoft: boolean;
    successMessage?: string;
    assertMessage?: string;
    originalMethod: string;
    args: any[];
}

export interface IAssertionErrorMeta extends IAssertionSuccessMeta {
    errorMessage?: string;
    error?: Error;
}

export interface IAssertionOptions {
    isSoft?: boolean;
    onSuccess?: (IAssertionSuccessMeta) => void | Promise<void>;
    onError?: (IAssertionErrorMeta) => void | Error | Promise<void | Error>;
    plugins?: ChaiPlugin[];
}
